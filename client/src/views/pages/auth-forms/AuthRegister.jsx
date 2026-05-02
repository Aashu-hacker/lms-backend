import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';
import { strengthColor, strengthIndicator } from 'utils/password-strength';
import REACT_APP_BASE_URL from 'utils/api';


// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function AuthRegister() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(true);
  const [loading, setLoading] = useState(false);

  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState();

  // ✅ form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setStrength(temp);
    setLevel(strengthColor(temp));
  };

  useEffect(() => {
    changePassword(form.password);
  }, [form.password]);

  // ✅ handle input change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ✅ submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checked) {
      alert('Please accept Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.firstName + ' ' + form.lastName,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation
      };

      const res = await axios.post(`${REACT_APP_BASE_URL}/auth/register`, payload);

      alert(res.data.message);

      // 👉 redirect to login
      navigate('/');

    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack sx={{ mb: 2, alignItems: 'center' }}>
        <Typography variant="subtitle1">Sign up with Email address</Typography>
      </Stack>

      <Grid container spacing={{ xs: 0, sm: 2 }}>
        <Grid item xs={12} sm={6}>
          <CustomFormControl fullWidth>
            <InputLabel>First Name</InputLabel>
            <OutlinedInput
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </CustomFormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <CustomFormControl fullWidth>
            <InputLabel>Last Name</InputLabel>
            <OutlinedInput
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </CustomFormControl>
        </Grid>
      </Grid>

      <CustomFormControl fullWidth>
        <InputLabel>Email Address</InputLabel>
        <OutlinedInput
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </CustomFormControl>

      <CustomFormControl fullWidth>
        <InputLabel>Password</InputLabel>
        <OutlinedInput
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          endAdornment={
            <InputAdornment position="end">
              <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword}>
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          }
        />
      </CustomFormControl>

      {/* Confirm Password */}
      <CustomFormControl fullWidth>
        <InputLabel>Confirm Password</InputLabel>
        <OutlinedInput
          type="password"
          name="password_confirmation"
          value={form.password_confirmation}
          onChange={handleChange}
          required
        />
      </CustomFormControl>

      {strength !== 0 && (
        <FormControl fullWidth>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
              <Box sx={{ width: 85, height: 8, borderRadius: '7px', bgcolor: level?.color }} />
              <Typography variant="subtitle1" sx={{ fontSize: '0.75rem' }}>
                {level?.label}
              </Typography>
            </Stack>
          </Box>
        </FormControl>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        }
        label={
          <Typography variant="subtitle1">
            Agree with&nbsp;
            <Typography component={Link} to="#" variant="subtitle1">
              Terms & Condition
            </Typography>
          </Typography>
        }
      />

      <Box sx={{ mt: 2 }}>
        <AnimateButton>
          <Button
            disableElevation
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Sign up'}
          </Button>
        </AnimateButton>
      </Box>
    </form>
  );
}