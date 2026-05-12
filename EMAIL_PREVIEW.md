# Email Preview Documentation

## Overview
This document explains how to preview email templates before sending them to users.

## Available Endpoints

### 1. Tournament Status Email Preview
**GET** `/api/email-preview/tournament-status`

Preview the tournament registration status email with customizable parameters.

**Query Parameters (all optional):**
- `playerName` - Player name (default: "John Doe")
- `tournamentName` - Tournament name (default: "Summer Tennis Championship")
- `tournamentType` - Tournament type (default: "Singles")
- `tournamentDate` - Tournament date (default: "15 July 2024")
- `tournamentLocation` - Tournament location (default: "Seventy Five Tennis Club")
- `status` - Registration status: "APPROVED" or other statuses (default: "APPROVED")

**Example URLs:**
```
# Default approved email
http://localhost:3000/api/email-preview/tournament-status

# Custom parameters
http://localhost:3000/api/email-preview/tournament-status?playerName=Jane%20Smith&tournamentName=Winter%20Cup&status=REJECTED

# Different status
http://localhost:3000/api/email-preview/tournament-status?status=PENDING
```

### 2. Generic Email Template Preview
**GET** `/api/email-preview/:template`

Generic preview endpoint for different email templates.

**Available Templates:**
- `tournament-status` - Same as endpoint #1

**Query Parameters:** Same as above

**Example URLs:**
```
http://localhost:3000/api/email-preview/tournament-status?playerName=John%20Doe&status=APPROVED
```

## Usage Instructions

1. **Start your server** - Make sure your backend is running
2. **Open browser** - Navigate to any of the preview URLs
3. **Customize parameters** - Add query parameters to customize the email content
4. **View in browser** - The email will render directly in your browser
5. **Test different statuses** - Try different status values to see variations

## Features

- **Live Preview** - See exactly how emails will look to recipients
- **Customizable Content** - Test with different player names, tournaments, etc.
- **Status Variations** - Preview approved, rejected, pending, and other status emails
- **Responsive Design** - See how emails look on different screen sizes
- **Logo Integration** - Verify logo rendering and placement

## Development Benefits

- **Visual Testing** - Ensure emails look perfect before sending
- **Content Validation** - Verify dynamic content renders correctly
- **Design Iteration** - Quickly test design changes without sending real emails
- **Cross-browser Testing** - Test email rendering in different browsers
- **Mobile Testing** - Check responsive design on mobile devices

## Security Notes

- These endpoints are intended for development/testing only
- Consider adding authentication for production environments
- No actual emails are sent from these endpoints
- All data is rendered as HTML preview only

## Troubleshooting

If you encounter issues:
1. Check that the server is running on the correct port
2. Verify the URL parameters are properly URL-encoded
3. Ensure the EmailService is properly initialized
4. Check browser console for any JavaScript errors
5. Verify all required dependencies are installed

## Future Enhancements

Potential additions:
- More email template types
- Parameter validation
- Authentication for production use
- Email client compatibility testing
- Batch preview functionality
