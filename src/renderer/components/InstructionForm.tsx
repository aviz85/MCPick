import React, { useState, useEffect } from 'react';
import { Instruction } from '../types';
import { useInstructions } from '../context/InstructionsContext';

interface InstructionFormProps {
  editId?: string;
  initialValues?: Instruction;
  onClose: () => void;
}

const defaultInstruction: Instruction = {
  name: '',
  description: '',
  content: '',
  enabled: true
};

const InstructionForm: React.FC<InstructionFormProps> = ({
  editId,
  initialValues,
  onClose
}) => {
  const { saveInstruction } = useInstructions();
  const [formData, setFormData] = useState<Instruction>(initialValues || defaultInstruction);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize form when props change
    if (initialValues) {
      setFormData(initialValues);
    } else {
      setFormData(defaultInstruction);
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const id = editId || `instruction-${Date.now()}`;
      const success = await saveInstruction(id, formData);
      
      if (success) {
        onClose();
      } else {
        setErrors({ submit: 'Failed to save instruction' });
      }
    } catch (err) {
      console.error('Error saving instruction:', err);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>{editId ? 'Edit Instruction' : 'Add Instruction'}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: errors.name ? '1px solid #dc004e' : '1px solid #ccc'
              }}
              placeholder="Enter a name for this instruction"
            />
            {errors.name && (
              <div style={{ color: '#dc004e', fontSize: '0.8em', marginTop: '4px' }}>{errors.name}</div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: errors.description ? '1px solid #dc004e' : '1px solid #ccc'
              }}
              placeholder="Enter a description"
            />
            {errors.description && (
              <div style={{ color: '#dc004e', fontSize: '0.8em', marginTop: '4px' }}>{errors.description}</div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: errors.content ? '1px solid #dc004e' : '1px solid #ccc',
                fontFamily: 'monospace'
              }}
              placeholder="Enter the instruction content"
            />
            {errors.content && (
              <div style={{ color: '#dc004e', fontSize: '0.8em', marginTop: '4px' }}>{errors.content}</div>
            )}
          </div>

          {errors.submit && (
            <div style={{ 
              backgroundColor: '#ffe6e6', 
              color: '#dc004e', 
              padding: '8px', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#1976d2',
                color: 'white',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Instruction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructionForm; 