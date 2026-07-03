// Public catalog (rental items) from the database, so the site reflects admin edits.
export async function fetchProducts() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Could not load rentals (${res.status})`);
  return res.json();
}

// Public packages from the database (same reason — reflects admin edits).
export async function fetchPackages() {
  const res = await fetch("/api/packages");
  if (!res.ok) throw new Error(`Could not load packages (${res.status})`);
  return res.json();
}
