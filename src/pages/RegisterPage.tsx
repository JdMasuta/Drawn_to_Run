import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;