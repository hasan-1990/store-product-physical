// In-memory storage as fallback when MongoDB is not available
const inMemorySections: any[] = [];

// اضافه کردن console.log برای debug
console.log('🔧 Fallback storage initialized with sections:', inMemorySections);

let nextId = 1;

export const fallbackStorage = {
  getSections: () => {
    const sorted = inMemorySections.sort((a, b) => a.order - b.order);
    console.log('📦 Fallback getSections called, returning:', sorted);
    return sorted;
  },
  
  addSection: (section: any) => {
    const newSection = {
      id: nextId.toString(),
      ...section,
      order: inMemorySections.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemorySections.push(newSection);
    nextId++;
    return newSection;
  },
  
  updateSection: (id: string, updates: any) => {
    const index = inMemorySections.findIndex(s => s.id === id);
    if (index !== -1) {
      inMemorySections[index] = {
        ...inMemorySections[index],
        ...updates,
        updatedAt: new Date()
      };
      return true;
    }
    return false;
  },
  
  deleteSection: (id: string) => {
    const index = inMemorySections.findIndex(s => s.id === id);
    if (index !== -1) {
      inMemorySections.splice(index, 1);
      return true;
    }
    return false;
  },
  
  updateOrder: (sections: any[]) => {
    sections.forEach((section, index) => {
      const existing = inMemorySections.find(s => s.id === section.id);
      if (existing) {
        existing.order = index;
        existing.updatedAt = new Date();
      }
    });
  }
};