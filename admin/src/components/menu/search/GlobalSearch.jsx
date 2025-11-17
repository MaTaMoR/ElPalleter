import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Search, X, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './GlobalSearch.module.css';

/**
 * Global search component that searches across all menu items
 * Shows results with breadcrumbs (Category > Subcategory > Item)
 * Highlights matching text
 */
const GlobalSearch = ({ categoriesMap, subcategoriesMap, itemsMap, childrenMap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const foundResults = [];

    // Search through categories, subcategories, and items
    categoriesMap.forEach((category, categoryHId) => {
      const categoryId = category.id;
      const categoryNameMatch = (category.nameKey || '').toLowerCase().includes(searchLower);

      // Check if category matches
      if (categoryNameMatch) {
        foundResults.push({
          type: 'category',
          category,
          categoryId,
          matchIn: 'name'
        });
      }

      const subcategoryHIds = childrenMap.get(categoryHId) || [];

      subcategoryHIds.forEach(subcategoryHId => {
        const subcategory = subcategoriesMap.get(subcategoryHId);
        if (!subcategory) return;

        const subcategoryNameMatch = (subcategory.nameKey || '').toLowerCase().includes(searchLower);

        // Check if subcategory matches
        if (subcategoryNameMatch) {
          foundResults.push({
            type: 'subcategory',
            subcategory,
            category,
            categoryId,
            subcategoryId: subcategory.id,
            matchIn: 'name'
          });
        }

        // Search through items
        const itemHIds = childrenMap.get(subcategoryHId) || [];

        itemHIds.forEach(itemHId => {
          const item = itemsMap.get(itemHId);
          if (!item) return;

          const nameMatch = (item.nameKey || '').toLowerCase().includes(searchLower);
          const descMatch = (item.descriptionKey || '').toLowerCase().includes(searchLower);

          if (nameMatch || descMatch) {
            foundResults.push({
              type: 'item',
              item,
              subcategory,
              category,
              categoryId,
              subcategoryId: subcategory.id,
              itemId: item.id,
              matchIn: nameMatch ? 'name' : 'description'
            });
          }
        });
      });
    });

    setResults(foundResults);
    setIsOpen(foundResults.length > 0);
  }, [searchTerm, categoriesMap, subcategoriesMap, itemsMap, childrenMap]);

  // Highlight matching text
  const highlightText = (text, highlight) => {
    if (!text) return '';
    if (!highlight) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      )
    );
  };

  // Navigate based on result type
  const handleResultClick = (result) => {
    const pathParts = location.pathname.split('/categories')[0];

    if (result.type === 'category') {
      navigate(`${pathParts}/categories/${result.categoryId}`);
    } else if (result.type === 'subcategory') {
      navigate(`${pathParts}/categories/${result.categoryId}/${result.subcategoryId}`);
    } else if (result.type === 'item') {
      navigate(`${pathParts}/categories/${result.categoryId}/${result.subcategoryId}`);
    }

    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={styles.globalSearch} ref={searchRef}>
      <div className={styles.searchInputWrapper}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar en toda la carta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className={styles.resultsDropdown}>
          <div className={styles.resultsHeader}>
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </div>
          <div className={styles.resultsList}>
            {results.map((result, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => handleResultClick(result)}
              >
                {result.type === 'category' && (
                  <div className={styles.breadcrumb}>
                    <span className={styles.breadcrumbItemLast}>
                      {highlightText(result.category.nameKey || 'Sin nombre', searchTerm)}
                    </span>
                    <span className={styles.resultType}>Categoría</span>
                  </div>
                )}

                {result.type === 'subcategory' && (
                  <div className={styles.breadcrumb}>
                    <span className={styles.breadcrumbItem}>{result.category.nameKey || 'Sin nombre'}</span>
                    <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                    <span className={styles.breadcrumbItemLast}>
                      {highlightText(result.subcategory.nameKey || 'Sin nombre', searchTerm)}
                    </span>
                    <span className={styles.resultType}>Subcategoría</span>
                  </div>
                )}

                {result.type === 'item' && (
                  <>
                    <div className={styles.breadcrumb}>
                      <span className={styles.breadcrumbItem}>{result.category.nameKey || 'Sin nombre'}</span>
                      <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                      <span className={styles.breadcrumbItem}>{result.subcategory.nameKey || 'Sin nombre'}</span>
                      <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                      <span className={styles.breadcrumbItemLast}>
                        {highlightText(result.item.nameKey || 'Sin nombre', searchTerm)}
                      </span>
                    </div>
                    {result.item.descriptionKey && (
                      <div className={styles.itemDescription}>
                        {highlightText(result.item.descriptionKey, searchTerm)}
                      </div>
                    )}
                    {result.item.price && (
                      <div className={styles.itemPrice}>
                        {parseFloat(result.item.price).toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}€
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

GlobalSearch.propTypes = {
  categoriesMap: PropTypes.instanceOf(Map).isRequired,
  subcategoriesMap: PropTypes.instanceOf(Map).isRequired,
  itemsMap: PropTypes.instanceOf(Map).isRequired,
  childrenMap: PropTypes.instanceOf(Map).isRequired
};

export default GlobalSearch;
