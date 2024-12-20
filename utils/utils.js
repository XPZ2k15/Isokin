// utils/utils.js
const path = require('path');

/**
 * Parses field definitions considering nested parentheses.
 * @param {string} fieldsStr - The string containing field definitions.
 * @returns {Array} - Array of parsed field definitions.
 */
function parseFields(fieldsStr) {
  const fields = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < fieldsStr.length; i++) {
    const ch = fieldsStr[i];
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;

    // Only split on commas if we are not inside parentheses
    if (ch === ',' && parenDepth === 0) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  // Add the last field if there's any
  if (current.trim()) fields.push(current.trim());

  return fields;
}

/**
 * Groups routes by their first path segment.
 * @param {Array} routes - Array of route objects.
 * @returns {Object} - Grouped routes.
 */
function groupRoutesByPrefix(routes) {
  const groups = {};
  for (let r of routes) {
    const segments = r.path.split('/').filter(Boolean);
    const prefix = segments[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(r);
  }
  return groups;
}

module.exports = {
  parseFields,
  groupRoutesByPrefix,
};
