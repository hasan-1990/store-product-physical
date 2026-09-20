// Export seedProvinces function for use in React components
export const seedProvinces = async () => {
  try {
    const response = await fetch('/api/admin/provinces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'seed'
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error seeding provinces:', error);
    return { success: false, error: 'Failed to seed provinces' };
  }
};