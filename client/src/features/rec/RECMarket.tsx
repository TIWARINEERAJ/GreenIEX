import React, { useState, useEffect } from 'react';
import { RECertificate } from '../../types/market';

const RECMarket: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showToast = React.useCallback((message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  }, []);
  const [certificates, setCertificates] = useState<RECertificate[]>([]);
  const [selectedREC, setSelectedREC] = useState<RECertificate | null>(null);
  const [transferForm, setTransferForm] = useState({
    toAddress: '',
  });

  const fetchCertificates = React.useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rec/available');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      showToast('Error fetching certificates', 'error');
    }
  }, [showToast]);

  const handleTransfer = async () => {
    try {
      if (!selectedREC || !transferForm.toAddress) return;

      const response = await fetch(`http://localhost:3001/api/rec/transfer/${selectedREC.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress: transferForm.toAddress,
        }),
      });

      if (response.ok) {
        showToast('Certificate transferred successfully', 'success');
        setIsModalOpen(false);
        fetchCertificates();
      } else {
        throw new Error('Failed to transfer certificate');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast(errorMessage, 'error');
    }
  };

  const openTransferModal = (rec: RECertificate) => {
    setSelectedREC(rec);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return (
    <div>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>REC Certificates</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>ID</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Energy Type</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Generation Date</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Carbon Offset</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{cert.id.substring(0, 8)}...</td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{
                    backgroundColor: cert.energyType === 'SOLAR'
                      ? '#F7DC6F'
                      : cert.energyType === 'WIND'
                      ? '#87CEEB'
                      : '#ADD8E6',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    {cert.energyType}
                  </span>
                </td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{new Date(cert.generationDate).toLocaleDateString()}</td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>{cert.carbonOffset.toFixed(2)} tons</td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => openTransferModal(cert)}
                    style={{
                      backgroundColor: '#4299E1',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Transfer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
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
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Transfer Certificate</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Recipient Address</label>
              <input
                value={transferForm.toAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferForm({
                  ...transferForm,
                  toAddress: e.target.value,
                })}
                placeholder="Enter recipient's address"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            <button
              onClick={handleTransfer}
              style={{
                backgroundColor: '#48BB78',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RECMarket;
