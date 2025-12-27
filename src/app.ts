import express from 'express';
import config from './config';
import Loaders from './loader';

const app = express();
const PORT = config.port;
const LoaderService = new Loaders(app);

LoaderService.load();

app.use((req, res, next) => {
  res.cookie('session', 'token', {
    secure: true,      // ← Must be true for SameSite=None
    sameSite: true,  // ← Required for cross-site
    httpOnly: true     // ← Recommended for security
  });
  // Removed console.log untuk performa - gunakan logging middleware
  next();
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
