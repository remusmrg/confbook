// components/SearchAndFilters.jsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown } from 'react-icons/fa';

export default function SearchAndFilters({ 
  defaultSearch = '',
  defaultMinCapacity = '',
  defaultMaxPrice = '',
  defaultSortBy = 'name',
  totalRooms = 0,
  filteredCount = 0,
  hasFilters = false
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [minCapacity, setMinCapacity] = useState(defaultMinCapacity);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Actualizează URL-ul cu parametrii
  const updateURL = useCallback((params) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  // Debounced search pentru căutare text
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    // Clear timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Setează nou timeout
    const newTimeout = setTimeout(() => {
      updateURL({ 
        search: value,
        minCapacity,
        maxPrice,
        sortBy
      });
    }, 300);
    
    setSearchTimeout(newTimeout);
  };

  // Aplică filtrele imediat
  const applyFilters = () => {
    updateURL({
      search: searchTerm,
      minCapacity,
      maxPrice,
      sortBy
    });
  };

  // Resetează toate filtrele
  const clearAllFilters = () => {
    setSearchTerm('');
    setMinCapacity('');
    setMaxPrice('');
    setSortBy('name');
    router.push(pathname);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="space-y-4">
      {/* Bara de căutare */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                   bg-white placeholder-gray-500 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Caută după nume, descriere, adresă, locație sau facilități..."
        />
        
        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Controale filtre și sortare */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Buton toggle filtre */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                     ${showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <FaFilter />
            <span>Filtre</span>
            {(minCapacity || maxPrice) && (
              <span className="ml-1 px-2 py-0.5 bg-white text-blue-500 text-xs rounded-full">
                {(minCapacity ? 1 : 0) + (maxPrice ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Rezultate */}
          <span className="text-sm text-gray-600">
            {hasFilters ? (
              <>
                <span className="font-semibold">{filteredCount}</span> din {totalRooms} săli
              </>
            ) : (
              <>
                <span className="font-semibold">{totalRooms}</span> săli disponibile
              </>
            )}
          </span>
        </div>

        {/* Sortare */}
        <div className="flex items-center gap-2">
          <FaSortAmountDown className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateURL({
                search: searchTerm,
                minCapacity,
                maxPrice,
                sortBy: e.target.value
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Alfabetic</option>
            <option value="price_asc">Preț crescător</option>
            <option value="price_desc">Preț descrescător</option>
            <option value="capacity">Capacitate</option>
          </select>
        </div>
      </div>

      {/* Panoul de filtre */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Capacitate minimă */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacitate minimă (persoane)
              </label>
              <input
                type="number"
                min="1"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 10"
              />
            </div>

            {/* Preț maxim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preț maxim (lei/oră)
              </label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 200"
              />
            </div>
          </div>

          {/* Butoane acțiune */}
          <div className="flex justify-between">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              Șterge filtrele
            </button>
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aplică filtrele
            </button>
          </div>
        </div>
      )}

      {/* Chips cu filtre active */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Caută: "{searchTerm}"
              <button 
                onClick={() => handleSearchChange('')}
                className="hover:text-blue-900"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {minCapacity && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Min. {minCapacity} persoane
              <button 
                onClick={() => {
                  setMinCapacity('');
                  updateURL({ search: searchTerm, maxPrice, sortBy });
                }}
                className="hover:text-blue-900"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {maxPrice && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Max. {maxPrice} lei/oră
              <button 
                onClick={() => {
                  setMaxPrice('');
                  updateURL({ search: searchTerm, minCapacity, sortBy });
                }}
                className="hover:text-blue-900"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}