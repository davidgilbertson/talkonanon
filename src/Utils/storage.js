export const get = id => {
  const storedItem = localStorage.getItem(id);

  try {
    // Try and parse JSON
    return JSON.parse(storedItem);
  } catch (err) {
    // It might just be a plain string or something, so return it, or nothing
    return storedItem || undefined;
  }
};

export const set = (id, data) => {
  JSON.stringify(localStorage.setItem(id, data));
};
