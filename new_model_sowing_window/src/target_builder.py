def get_sowing_info(crop, season=None):
    return {"General Sowing Info": {"description": "Standard seasonal sowing period."}}

def get_all_supported_crops():
    return ["rice", "wheat", "maize", "cotton", "soybean", "barley"]
