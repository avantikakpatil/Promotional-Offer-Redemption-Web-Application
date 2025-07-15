import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI } from '../../../services/api';
import CampaignForm from './CampaignForm';

const CampaignEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await campaignAPI.getCampaignById(id);
        if (res.data && res.data.data) {
          // Flatten eligibleProducts for form
          setInitialData({
            ...res.data.data,
            eligibleProducts: res.data.data.eligibleProducts || [],
            rewardTiers: res.data.data.rewardTiers || [],
          });
        } else {
          setInitialData(null);
        }
      } catch (err) {
        setInitialData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [id]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setErrors({});
    try {
      await campaignAPI.updateCampaign(id, formData);
      alert('Campaign updated successfully!');
      navigate('/manufacturer/dashboard');
    } catch (error) {
      let errorMsg = 'Error updating campaign.';
      if (error.response && error.response.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMsg = error.response.data.errors.join(', ');
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      }
      setErrors({ form: errorMsg });
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading campaign...</div>;
  if (!initialData) return <div>Campaign not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Campaign</h1>
      <CampaignForm
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={saving}
        errors={errors}
        submitLabel="Update Campaign"
      />
    </div>
  );
};

export default CampaignEdit; 