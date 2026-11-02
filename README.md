# Multi-Modal Attendance System for HRMS

A comprehensive biometric attendance system built on Frappe HRMS v15, supporting multiple check-in methods:

- 🎭 **Face Recognition** - AI-powered touchless check-ins with mask support
- 🔢 **PIN/ID Entry** - Traditional employee ID + PIN on touchscreen
- 💳 **Card-Based** - NFC tags, QR codes, and RFID badge scanning
- 📱 **Mobile & Tablet** - iOS/Android apps + tablet kiosk mode
- 📍 **GPS Tagging** - Location verification for field staff
- 🔒 **Secure & Private** - AES-256 encryption, GDPR compliant

## Technology Stack

- **Backend:** Frappe HRMS v15 (Python)
- **Database:** MariaDB/MySQL
- **Face Recognition:** Python `face_recognition` library
- **Mobile App:** React Native (iOS + Android)
- **Deployment:** Self-hosted (on-premise/VPS)

## Project Structure

```
Face_biometric/
├── mobile/                           # React Native mobile app
├── docs/                             # Documentation
└── README.md
```

## Features

### For Employees
- Multiple check-in options (choose face, PIN, or card)
- Mobile app for remote/field workers
- GPS-tagged attendance
- View attendance history
- Privacy controls

### For HR Managers
- Real-time attendance dashboard
- Multiple check-in method analytics
- Geofence management
- Employee enrollment management
- Comprehensive reports

### For System Admins
- Multi-method authentication setup
- Security and encryption controls
- Audit logs
- Integration with payroll

## Quick Start

### Prerequisites
- Frappe HRMS v15 installed
- Python 3.10+
- Node.js 18+ (for mobile app)
- MariaDB/MySQL

### Installation

1. **Create Custom Frappe App**
   ```bash
   cd frappe-bench
   bench new-app attendance_biometric
   bench --site [your-site] install-app attendance_biometric
   ```

2. **Install Python Dependencies**
   ```bash
   cd apps/attendance_biometric
   pip install face_recognition opencv-python geopy cryptography
   ```

3. **Setup Mobile App**
   ```bash
   cd ../../mobile
   npm install
   ```

4. **Configure Encryption**
   ```bash
   bench --site [your-site] set-config biometric_encryption_key [your-key]
   ```

## Documentation

- [Installation Guide](docs/installation.md)
- [API Documentation](docs/api.md)
- [Mobile App Setup](docs/mobile-setup.md)
- [Security & Privacy](docs/security.md)

## License

MIT License

## Support

For issues and questions, please open a GitHub issue.
