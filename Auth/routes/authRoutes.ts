import express from 'express';
import passport from 'passport';
import {
  renderSignIn,
  renderLogin,
  registerUser,
  loginUser,
  handleOAuth,
  googleCallback,
  logout
} from '../controllers/authController';

const router = express.Router();

router.get('/', renderSignIn);
router.get('/login', renderLogin);
router.post('/create', registerUser);
router.post('/logIn', loginUser);
router.get('/oauth', handleOAuth);
router.get('/logout', logout);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), googleCallback);

export default router;
