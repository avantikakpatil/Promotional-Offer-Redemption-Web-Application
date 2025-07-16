import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI } from '../../../services/api';

const CampaignView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const res = await campaignAPI.getCampaignById(id);
        if (res.data && res.data.data) {
          setCampaign(res.data.data);
        } else {
          setError('Campaign not found.');
        }
      } catch (err) {
        setError('Failed to fetch campaign.');
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [id]);

  if (loading) return <div>Loading campaign...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!campaign) return <div>Campaign not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-4">Campaign Details</h1>
      <div className="mb-6">
        <div className="text-lg font-semibold">{campaign.name}</div>
        <div className="text-gray-600">{campaign.description}</div>
        <div className="mt-2 text-sm text-gray-500">Product Type: {campaign.productType}</div>
        <div className="mt-1 text-sm text-gray-500">Points: {campaign.points}</div>
        <div className="mt-1 text-sm text-gray-500">Start: {new Date(campaign.startDate).toLocaleDateString()}</div>
        <div className="mt-1 text-sm text-gray-500">End: {new Date(campaign.endDate).toLocaleDateString()}</div>
        {campaign.budget && <div className="mt-1 text-sm text-gray-500">Budget: ₹{campaign.budget}</div>}
        {campaign.targetAudience && <div className="mt-1 text-sm text-gray-500">Target Audience: {campaign.targetAudience}</div>}
        <div className="mt-1 text-sm text-gray-500">Status: {campaign.isActive ? 'Active' : 'Inactive'}</div>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Reward Tiers</h2>
        {campaign.rewardTiers && campaign.rewardTiers.length > 0 ? (
          <ul className="list-disc ml-6">
            {campaign.rewardTiers.map((tier, idx) => (
              <li key={tier.id || idx}>
                <span className="font-semibold">{tier.threshold} pts:</span> {tier.reward}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No reward tiers.</div>
        )}
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Eligible Products for Redemption</h2>
        {campaign.eligibleProducts && campaign.eligibleProducts.length > 0 ? (
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                <th className="px-2 py-1 border">Product Name</th>
                <th className="px-2 py-1 border">Point Cost</th>
                <th className="px-2 py-1 border">Redemption Limit</th>
              </tr>
            </thead>
            <tbody>
              {campaign.eligibleProducts.map((ep, idx) => (
                <tr key={ep.productId || idx}>
                  <td className="px-2 py-1 border">{ep.productName}</td>
                  <td className="px-2 py-1 border">{ep.pointCost}</td>
                  <td className="px-2 py-1 border">{ep.redemptionLimit ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">No eligible products.</div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back
        </button>
        <button
          onClick={() => navigate(`/manufacturer/campaign/${id}/edit`)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default CampaignView; 