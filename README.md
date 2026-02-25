# Fahari Football Club Management System

A professional, lightweight football club management system built for Fahari Football Club.

## Features

- **Member Management**: Manage players and staff with detailed profiles
- **Financial Tracking**: Record salary payments, extra payments, and club income
- **Match Expenses**: Track expenses for each match
- **Dashboard**: Overview of key metrics and recent transactions
- **Professional Reports**: Generate and export PDF reports for members, finances, and match expenses
- **Secure Authentication**: Simple admin authentication system

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Currency**: TZS (Tanzanian Shillings)

## Default Login Credentials

```
Email: faharifc@gmail.com
Password: Fahari@001
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── Layout.tsx   # Main layout with sidebar
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── lib/             # Utilities and helpers
│   ├── supabase.ts
│   ├── utils.ts
│   └── pdfGenerator.ts
├── pages/           # Application pages
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Members.tsx
│   ├── Finances.tsx
│   ├── MatchExpenses.tsx
│   └── Reports.tsx
└── App.tsx          # Main application component
```

## Database Schema

### Tables

1. **members** - Players and staff information
2. **salary_payments** - Salary payment records
3. **extra_payments** - Bonus, transport, and other extra payments
4. **club_income** - Club income records
5. **match_expenses** - Match-related expenses

All tables have Row Level Security (RLS) enabled for authenticated users.

## Usage Guide

### Dashboard
View key metrics including:
- Total players and staff
- Financial summary (salaries, expenses, income)
- Net balance
- Recent transactions

### Members
- Add, edit, and delete players and staff
- View detailed member profiles with payment history
- Track total cost per member

### Finances
Manage three types of financial records:
- **Salary Payments**: Record monthly salary payments
- **Extra Payments**: Record bonuses, transport, and other payments
- **Club Income**: Record sponsorships, ticket sales, and other income

### Match Expenses
Track expenses for each match including:
- Opponent
- Date
- Category (transport, accommodation, meals, etc.)
- Amount and notes

### Reports
Generate professional PDF reports:
- Individual member financial reports
- All players summary
- All staff summary
- Match expenses report
- Full financial summary

## Sample Data

To populate the system with sample data for testing, run the following SQL in your Supabase SQL Editor:

```sql
-- Insert sample players
INSERT INTO members (full_name, date_of_birth, phone, role, member_type, monthly_salary) VALUES
('John Mwangi', '1995-03-15', '+255712345678', 'Striker', 'player', 800000),
('Peter Komba', '1998-07-22', '+255723456789', 'Midfielder', 'player', 600000),
('James Selemani', '1997-11-08', '+255734567890', 'Defender', 'player', 500000);

-- Insert sample staff
INSERT INTO members (full_name, date_of_birth, phone, role, member_type, monthly_salary) VALUES
('David Mushi', '1980-05-10', '+255745678901', 'Head Coach', 'staff', 1200000),
('Mary Juma', '1985-09-25', '+255756789012', 'Team Manager', 'staff', 700000);

-- Insert sample income
INSERT INTO club_income (amount, income_date, source, notes) VALUES
(5000000, '2024-01-15', 'Sponsorship', 'Main sponsor payment'),
(2000000, '2024-01-20', 'Ticket Sales', 'Home match revenue');

-- Insert sample match expenses
INSERT INTO match_expenses (opponent, match_date, category, amount, notes) VALUES
('Simba SC', '2024-01-18', 'Transport', 300000, 'Bus rental for away match'),
('Yanga SC', '2024-01-25', 'Accommodation', 500000, 'Hotel for team');
```

## Development

The system is ready to use immediately. All database migrations have been applied and the default admin user is created.

## Production Notes

- Change the default admin password after first login
- Regularly backup the database
- Monitor financial transactions for accuracy
- Generate monthly reports for club records

## Support

For issues or questions, contact the development team.
