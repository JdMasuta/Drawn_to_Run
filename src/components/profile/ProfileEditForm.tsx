// ProfileEditForm component - Form for editing user profile
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar } from '../ui/UserAvatar';
import type { User } from '../../types/api';

interface ProfileFormData {
  name: string;
  email: string;
  bio: string;
  profile_image: string;
}

export const ProfileEditForm: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      profile_image: user?.profile_image || '',
    },
  });

  const watchedValues = watch();

  // Create a preview user object for the avatar
  const previewUser: User = {
    ...user!,
    name: watchedValues.name,
    bio: watchedValues.bio,
    profile_image: watchedValues.profile_image,
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await updateProfile(data);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
        <p className="text-gray-600 mt-1">Update your personal information and preferences</p>
      </div>

      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-green-700">Profile updated successfully!</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Preview */}
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <UserAvatar user={previewUser} size="xl" />
            <p className="mt-2 text-sm text-gray-600">Profile Preview</p>
          </div>
        </div>

        {/* Profile Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image URL
          </label>
          <input
            type="url"
            {...register('profile_image', {
              pattern: {
                value: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
                message: 'Please enter a valid image URL (jpg, jpeg, png, gif, webp)',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/your-image.jpg"
          />
          {errors.profile_image && (
            <p className="mt-1 text-sm text-red-600">{errors.profile_image.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Upload your image to a service like Imgur or use a direct image URL
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            {...register('name', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 255, message: 'Name must be less than 255 characters' },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          {user?.email !== watchedValues.email && (
            <p className="mt-1 text-sm text-orange-600">
              Changing your email will require verification
            </p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            {...register('bio', {
              maxLength: { value: 500, message: 'Bio must be less than 500 characters' },
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself, your running goals, or anything you'd like other runners to know..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {watchedValues.bio?.length || 0}/500 characters
          </p>
        </div>

        {/* Account Info */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Role:</span>
              <span className="ml-2 font-medium text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Member since:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(user?.created_at || '').toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Email verified:</span>
              <span className={`ml-2 font-medium ${user?.email_verified ? 'text-green-600' : 'text-orange-600'}`}>
                {user?.email_verified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};