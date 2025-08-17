import React from 'react';

const EventsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Running Events</h1>
          <p className="mt-2 text-gray-600">
            Discover upcoming running events and register for your next challenge
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance
                  </label>
                  <div className="space-y-2">
                    {['5K', '10K', 'Half Marathon', 'Marathon'].map((distance) => (
                      <label key={distance} className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-600">{distance}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <div className="space-y-2">
                    {['Fun Run', 'Competition', 'Charity', 'Training'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-600">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="lg:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Placeholder event cards */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-6">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sample Event {i}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Join us for an exciting running event in a beautiful location.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>📅 Sep 15, 2025</span>
                    <span>📍 Central Park</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">5K</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Park</span>
                  </div>
                  <button className="btn btn-primary w-full">
                    Register
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;