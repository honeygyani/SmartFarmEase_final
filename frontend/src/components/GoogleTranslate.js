import React, { useEffect, useState } from 'react';
import { Box, Fab, Menu, MenuItem, Typography, ListItemIcon, Tooltip, useTheme } from '@mui/material';
import { Translate, Check } from '@mui/icons-material';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const GoogleTranslate = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (document.querySelector('script[src*="translate.google.com"]')) {
      setScriptLoaded(true);
      return;
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,ta,bn,mr,ml,te',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        'google_translate_element'
      );
      setScriptLoaded(true);
    };

    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    handleClose();

    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
      window.location.reload();
      return;
    }

    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname}`;

    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div
        id="google_translate_element"
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}
      />

      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 32 },
          right: { xs: 24, md: 32 },
          zIndex: 9999,
        }}
      >
        <Tooltip title="Change Language" placement="left" arrow>
          <Fab
            onClick={handleOpen}
            size="medium"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : 'primary.main',
              color: 'white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#334155' : 'primary.dark',
                transform: 'scale(1.08)',
              }
            }}
          >
            <Translate />
          </Fab>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          PaperProps={{
            sx: {
              borderRadius: 4,
              minWidth: 240,
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              border: `1px solid ${theme.palette.divider}`,
              mb: 1.5,
              overflow: 'hidden',
              bgcolor: 'background.paper'
            },
          }}
        >
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
              🌐 Select Language
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Powered by Google Translate
            </Typography>
          </Box>

          {LANGUAGES.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              selected={currentLang === lang.code}
              sx={{
                py: 1.5,
                px: 2.5,
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiTypography-root': { color: 'white' },
                  '& .MuiSvgIcon-root': { color: 'white' }
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {lang.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {lang.native}
                  </Typography>
                </Box>
                {currentLang === lang.code && (
                  <ListItemIcon sx={{ minWidth: 'unset' }}>
                    <Check sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </>
  );
};

export default GoogleTranslate;
