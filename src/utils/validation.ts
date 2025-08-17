// Validation utility functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEventForm(data: {
  title: string;
  event_date: string;
  location: string;
  distance_options: string[];
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.title.trim()) {
    errors.title = 'Event title is required';
  }

  if (!data.event_date) {
    errors.event_date = 'Event date is required';
  } else if (new Date(data.event_date) <= new Date()) {
    errors.event_date = 'Event date must be in the future';
  }

  if (!data.location.trim()) {
    errors.location = 'Event location is required';
  }

  if (!data.distance_options.length) {
    errors.distance_options = 'At least one distance option is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}