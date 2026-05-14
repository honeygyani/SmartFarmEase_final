# severity.py
import numpy as np
import cv2
from skimage.filters.rank import entropy
from skimage.morphology import disk
from skimage.util import img_as_ubyte

# ---------- Leaf mask ----------

def get_leaf_mask(bgr_img_256: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr_img_256, cv2.COLOR_BGR2HSV)

    lower_green  = np.array([25, 30, 30])
    upper_green  = np.array([90, 255, 255])
    mask_green   = cv2.inRange(hsv, lower_green, upper_green)

    lower_yellow = np.array([10, 30, 30])
    upper_yellow = np.array([35, 255, 255])
    mask_yellow  = cv2.inRange(hsv, lower_yellow, upper_yellow)

    mask = cv2.bitwise_or(mask_green, mask_yellow)

    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel, iterations=1)
    return mask

# ---------- Lesion segmentation ----------

def segment_lesions_hybrid(bgr_img: np.ndarray):
    if bgr_img is None:
        raise ValueError("segment_lesions_hybrid: input image is None")

    bgr = cv2.resize(bgr_img, (256, 256), interpolation=cv2.INTER_AREA)

    leaf_mask = get_leaf_mask(bgr)
    leaf_area = int(np.count_nonzero(leaf_mask))
    if leaf_area < 200:
        return leaf_mask, np.zeros_like(leaf_mask)

    b, g, r = cv2.split(bgr)

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    _, a, _ = cv2.split(lab)

    exg = 2 * g.astype(np.float32) - r.astype(np.float32) - b.astype(np.float32)

    leaf_idxs = leaf_mask > 0
    a_leaf   = a[leaf_idxs].astype(np.float32)
    exg_leaf = exg[leaf_idxs].astype(np.float32)

    if len(a_leaf) < 50:
        return leaf_mask, np.zeros_like(leaf_mask)

    mean_a,   std_a   = np.mean(a_leaf),   np.std(a_leaf)   + 1e-6
    mean_exg, std_exg = np.mean(exg_leaf), np.std(exg_leaf) + 1e-6

    z_a   = (a_leaf   - mean_a)   / std_a
    z_exg = (exg_leaf - mean_exg) / std_exg

    a_mask   = np.zeros_like(leaf_mask, dtype=np.uint8)
    exg_mask = np.zeros_like(leaf_mask, dtype=np.uint8)

    a_mask[leaf_idxs]   = (z_a   >  0.7).astype(np.uint8) * 255
    exg_mask[leaf_idxs] = (z_exg < -0.7).astype(np.uint8) * 255

    color_candidate = cv2.bitwise_and(a_mask, exg_mask)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray_leaf = cv2.bitwise_and(gray, gray, mask=leaf_mask)
    gray_u8   = img_as_ubyte(gray_leaf)

    ent = entropy(gray_u8, disk(3))
    ent_norm = cv2.normalize(ent, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    mean_ent_leaf = float(np.mean(ent_norm[leaf_idxs]))
    if mean_ent_leaf < 20:
        texture_candidate = leaf_mask.copy()
    else:
        _, texture_candidate = cv2.threshold(
            ent_norm, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        texture_candidate = cv2.bitwise_and(texture_candidate, leaf_mask)

    lesion_candidate = cv2.bitwise_and(color_candidate, texture_candidate)

    kernel = np.ones((3, 3), np.uint8)
    lesion_mask = cv2.morphologyEx(lesion_candidate, cv2.MORPH_CLOSE, kernel, iterations=2)
    lesion_mask = cv2.morphologyEx(lesion_mask, cv2.MORPH_OPEN,  kernel, iterations=1)

    return leaf_mask, lesion_mask

# ---------- DSI ----------

def compute_dsi(bgr_img: np.ndarray, leaf_mask: np.ndarray, lesion_mask: np.ndarray,
                w1: float = 0.4, w2: float = 0.35, w3: float = 0.25):
    h, w = leaf_mask.shape[:2]
    bgr = cv2.resize(bgr_img, (w, h), interpolation=cv2.INTER_AREA)

    leaf_area   = int(np.count_nonzero(leaf_mask))
    lesion_area = int(np.count_nonzero(lesion_mask))

    if leaf_area == 0:
        return 0.0, 0.0, 0.0, 0.0

    area_ratio = lesion_area / leaf_area
    if area_ratio < 0.15:
        area_ratio = area_ratio * 0.4

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    _, a, _ = cv2.split(lab)
    lesion_a = a[lesion_mask > 0]

    if len(lesion_a) == 0:
        ci_norm = 0.0
    else:
        ci_norm = float(np.clip(np.mean(lesion_a) / 255.0, 0.0, 1.0))

    contours, _ = cv2.findContours(leaf_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(contours) == 0:
        si_norm = 0.0
    else:
        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)
        per  = cv2.arcLength(c, True)
        if area == 0:
            si_norm = 0.0
        else:
            si = (per ** 2) / (4 * np.pi * area)
            si_norm = float(np.clip((si - 1.0) / 2.0, 0.0, 1.0))

    dsi = w1 * area_ratio + w2 * ci_norm + w3 * si_norm
    dsi = float(np.clip(dsi, 0.0, 1.0))

    return dsi, float(area_ratio), ci_norm, si_norm

def classify_severity_level(dsi: float) -> str:
    if dsi < 0.32:
        return "Healthy"
    elif dsi < 0.7:
        return "Medium"
    else:
        return "High"

def estimate_severity_from_bgr(bgr_img: np.ndarray) -> dict:
    leaf_mask, lesion_mask = segment_lesions_hybrid(bgr_img)
    dsi, area_ratio, ci_norm, si_norm = compute_dsi(bgr_img, leaf_mask, lesion_mask)
    level = classify_severity_level(dsi)
    return {
        "severity_index": dsi,
        "severity_level": level,
        "lesion_area_ratio": area_ratio,
        "color_index": ci_norm,
        "shape_irregularity": si_norm,
    }