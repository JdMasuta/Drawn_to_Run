import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AboutPage from '../AboutPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AboutPage', () => {
  describe('Content and Layout', () => {
    it('renders the main heading', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /about drawn to run/i })).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/connecting the running community through events/i)).toBeInTheDocument();
    });

    it('renders the mission section', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /our mission/i })).toBeInTheDocument();
      expect(screen.getByText(/we believe running is more than just putting one foot/i)).toBeInTheDocument();
    });

    it('renders how it works section with three cards', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /discover events/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /connect & share/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /track progress/i })).toBeInTheDocument();
    });

    it('renders platform features section', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /platform features/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /for runners/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /for event organizers/i })).toBeInTheDocument();
    });

    it('renders technology stack section', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /built with modern technology/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /frontend/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /backend & infrastructure/i })).toBeInTheDocument();
    });

    it('renders contact section', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByRole('heading', { name: /get in touch/i })).toBeInTheDocument();
      expect(screen.getByText(/have questions, suggestions, or want to organize/i)).toBeInTheDocument();
    });
  });

  describe('Technology Stack Content', () => {
    it('displays frontend technologies', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText('React 18')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Vite')).toBeInTheDocument();
      expect(screen.getByText('TailwindCSS')).toBeInTheDocument();
      expect(screen.getByText('React Query')).toBeInTheDocument();
    });

    it('displays backend technologies', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText('Netlify Functions')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('Neon Database')).toBeInTheDocument();
      expect(screen.getByText('JWT Auth')).toBeInTheDocument();
    });
  });

  describe('Feature Lists', () => {
    it('lists runner features correctly', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/event discovery with advanced filtering/i)).toBeInTheDocument();
      expect(screen.getByText(/easy registration and event management/i)).toBeInTheDocument();
      expect(screen.getByText(/social features and community interaction/i)).toBeInTheDocument();
      expect(screen.getByText(/personal dashboard and activity feed/i)).toBeInTheDocument();
    });

    it('lists organizer features correctly', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/easy event creation and management/i)).toBeInTheDocument();
      expect(screen.getByText(/registration management and capacity tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/event promotion and community engagement/i)).toBeInTheDocument();
      expect(screen.getByText(/event tagging and categorization system/i)).toBeInTheDocument();
    });

    it('indicates coming soon features', () => {
      renderWithRouter(<AboutPage />);
      const comingSoonElements = screen.getAllByText(/coming soon:/i);
      expect(comingSoonElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/strava integration for performance tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics and reporting tools/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('has correct navigation links', () => {
      renderWithRouter(<AboutPage />);
      
      const contactLink = screen.getByRole('link', { name: /contact us/i });
      expect(contactLink).toHaveAttribute('href', 'mailto:hello@drawntorun.com');

      const communityLink = screen.getByRole('link', { name: /join community/i });
      expect(communityLink).toHaveAttribute('href', '/community');

      const eventsLink = screen.getByRole('link', { name: /start exploring events/i });
      expect(eventsLink).toHaveAttribute('href', '/events');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter(<AboutPage />);
      
      // Main page heading should be h1
      const mainHeading = screen.getByRole('heading', { name: /about drawn to run/i });
      expect(mainHeading.tagName).toBe('H1');

      // Section headings should exist
      expect(screen.getByRole('heading', { name: /our mission/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /platform features/i })).toBeInTheDocument();
    });

    it('has proper list structures for features', () => {
      renderWithRouter(<AboutPage />);
      
      // Check for list structures in feature sections
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('has appropriate link attributes', () => {
      renderWithRouter(<AboutPage />);
      
      // Email link should have proper href
      const emailLink = screen.getByRole('link', { name: /contact us/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:hello@drawntorun.com');
    });
  });

  describe('Content Quality', () => {
    it('provides clear mission statement', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/we believe running is more than just putting one foot in front of the other/i)).toBeInTheDocument();
      expect(screen.getByText(/it's about community, personal growth/i)).toBeInTheDocument();
    });

    it('explains the platform value proposition', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/drawn to run brings together runners of all levels/i)).toBeInTheDocument();
      expect(screen.getByText(/whether you're training for your first 5k or your twentieth marathon/i)).toBeInTheDocument();
    });

    it('provides comprehensive feature coverage', () => {
      renderWithRouter(<AboutPage />);
      // Check that both runner and organizer perspectives are covered
      expect(screen.getByRole('heading', { name: /for runners/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /for event organizers/i })).toBeInTheDocument();
    });

    it('includes contact information', () => {
      renderWithRouter(<AboutPage />);
      expect(screen.getByText(/have questions, suggestions, or want to organize an event/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument();
    });
  });

  describe('Visual Design Elements', () => {
    it('includes SVG icons for visual appeal', () => {
      renderWithRouter(<AboutPage />);
      // SVG icons should be present (rendered as generic elements in test)
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('uses proper styling classes', () => {
      renderWithRouter(<AboutPage />);
      // Check that the main container has proper styling
      const mainContainer = document.querySelector('.min-h-screen.bg-gray-50');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});