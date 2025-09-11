'use client';

import { useState, useEffect } from 'react';
import qeBestPracticesData from '../data/qe-best-practices.json';

interface QEPractice {
  id: number;
  priority: string;
  category: string;
  subCategory: string;
  description: string;
}

interface EditableQEPractice extends Omit<QEPractice, 'id'> {
  id?: number;
}

export default function QEBestPracticesTable() {
  const [practices, setPractices] = useState<QEPractice[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditableQEPractice>({
    priority: '',
    category: '',
    subCategory: '',
    description: ''
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    setPractices(qeBestPracticesData as QEPractice[]);
  }, []);

  const handleEdit = (practice: QEPractice) => {
    setEditingId(practice.id);
    setEditingData({
      priority: practice.priority,
      category: practice.category,
      subCategory: practice.subCategory,
      description: practice.description
    });
    setIsAddingNew(false);
  };

  const handleSave = () => {
    console.log("handleSave called")
    if (isAddingNew) {
      const newId = Math.max(...practices.map(p => p.id), 0) + 1;
      const newPractice: QEPractice = {
        id: newId,
        ...editingData
      };
      setPractices([newPractice, ...practices]);
      setIsAddingNew(false);
    } else if (editingId) {
      setPractices(practices.map(practice => 
        practice.id === editingId 
          ? { ...practice, ...editingData }
          : practice
      ));
      setEditingId(null);
    }
    setEditingData({
      priority: '',
      category: '',
      subCategory: '',
      description: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setEditingData({
      priority: '',
      category: '',
      subCategory: '',
      description: ''
    });
  };

  const handleDelete = (id: number) => {
    setPractices(practices.filter(practice => practice.id !== id));
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setEditingData({
      priority: '',
      category: '',
      subCategory: '',
      description: ''
    });
  };

  const handleInputChange = (field: keyof EditableQEPractice, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(practices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qe-best-practices.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        QE BEST PRACTICES
      </h1>
      
      <div className="mb-4 flex gap-4">
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          + Add New Practice
        </button>
        <button
          onClick={handleDownloadJSON}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span className="text-sm">📥</span>
          Download JSON
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sub-Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
           <tbody className="bg-white divide-y divide-gray-200"> 
            {isAddingNew && (
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={editingData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={editingData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Category"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={editingData.subCategory}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sub-Category"
                  />
                </td>
                <td className="px-6 py-4">
                  <textarea
                    value={editingData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description"
                    rows={2}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}   
            {practices.map((practice) => (
              <tr key={practice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === practice.id ? (
                    <select
                      value={editingData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(practice.priority)}`}>
                      {practice.priority}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === practice.id ? (
                    <input
                      type="text"
                      value={editingData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{practice.category}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === practice.id ? (
                    <input
                      type="text"
                      value={editingData.subCategory}
                      onChange={(e) => handleInputChange('subCategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{practice.subCategory}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === practice.id ? (
                    <textarea
                      value={editingData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{practice.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {editingId === practice.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(practice)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(practice.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
