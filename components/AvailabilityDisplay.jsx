'use client';

import { parseAvailability, formatAvailability } from '@/utils/availability';
import { FaClock, FaCalendarAlt } from 'react-icons/fa';

const AvailabilityDisplay = ({ availabilityString, className = '' }) => {
  if (!availabilityString || availabilityString.trim() === '') {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <FaClock className="mr-2" />
        <span>Disponibil oricând</span>
      </div>
    );
  }

  try {
    const availability = parseAvailability(availabilityString);
    const formatted = formatAvailability(availability);
    
    return (
      <div className={`${className}`}>
        <div className="flex items-center text-blue-600 mb-2">
          <FaCalendarAlt className="mr-2" />
          <span className="font-medium">Program disponibilitate:</span>
        </div>
        <div className="text-sm text-gray-700 ml-6">
          {formatted}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className={`flex items-center text-orange-600 ${className}`}>
        <FaClock className="mr-2" />
        <span className="text-sm">Program: {availabilityString}</span>
      </div>
    );
  }
};

export default AvailabilityDisplay;