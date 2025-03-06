# Doctor Finder Application

This project transforms a simple registration application into a fully functional doctor finding application that allows users to search for doctors by specialty, insurance coverage, and location.

## Changes Made

### Database Structure
1. Created new tables for:
   - `doctors` - Stores doctor information including name, contact details, and affiliation
   - `specialties` - Stores medical specialties
   - `insurances` - Stores insurance plans
   - `doctor_specialties` - Junction table connecting doctors to their specialties
   - `doctor_insurances` - Junction table connecting doctors to accepted insurance plans

2. Added sample data featuring real doctors from Morehouse School of Medicine and other Atlanta institutions

### Backend API
1. Added new endpoints in server.js:
   - `/api/specialties` - Fetches all available medical specialties
   - `/api/insurances` - Fetches all available insurance plans
   - `/api/doctors/search` - Searches for doctors with filters for specialty, insurance, and zipcode
   - `/api/doctors/:id` - Retrieves detailed information about a specific doctor

2. Implemented search functionality with support for filtering by multiple criteria

3. Maintained existing user authentication system (register, login, verify)

### Frontend Components
1. Transformed the Dashboard component:
   - Added search form with dropdown menus for specialties and insurance
   - Implemented zipcode search field
   - Created results display section
   - Added detailed doctor view

2. Updated App component:
   - Modified app title and description
   - Added background image for the login/register screen
   - Maintained existing authentication tabs and forms

3. User Interface Improvements:
   - Complete redesign with a clean, modern look
   - New color scheme (blue instead of pink)
   - Background image on login/register screen
   - Semi-transparent login container with frosted glass effect

### CSS Styling
1. Complete overhaul of the design:
   - Changed from pink to a professional blue color palette
   - Improved typography using Roboto font
   - Added subtle shadows and hover effects
   - Created responsive layouts that work on different screen sizes

2. Layout improvements:
   - Grid-based layout for search and results
   - Proper containment of scrollable areas
   - Responsive design that adapts to smaller screens

## Features

### User Authentication
- Register with email verification
- Login system for returning users
- Secure password storage with bcrypt hashing

### Doctor Search
- Search by medical specialty
- Filter by accepted insurance plans
- Search by zipcode location
- View detailed doctor profiles

### Doctor Profiles
- Contact information
- Professional background
- Specialties
- Accepted insurance plans

## Technologies Used
- Frontend: React.js
- Backend: Express.js, Node.js
- Database: PostgreSQL
- Authentication: JWT tokens
- Styling: Custom CSS

## Setup Instructions

1. **Clone this repository**

2. **Install dependencies:**

   ```bash
   npm install
   cd client
   npm install

3. **Set up your environment variables in a `.env` file:**
```
DATABASE_URL=your_postgres_connection_string
BREVO_API_KEY=your_brevo_api_key
```

4. **Run the database migration:**
```
node migration.js
```

5. **Start the development server:**
```
node server.js
```

## Deploying to Heroku
Make sure to add the postgres addon:
```
heroku addons:create heroku-postgresql:essential-0
```


## Future Enhancements
- Appointment scheduling system
- Doctor ratings and reviews
- Map integration for location-based search
- Advanced filtering options
