const API_BASE = 'http://localhost:5000/api/user';
const AUTH_BASE = 'http://localhost:5000/api/auth';

type OnboardingProfile = {
  company: string | null;
  role: string | null;
};

export const fetchOnboardingProfile = async (authToken: string): Promise<OnboardingProfile> => {
  const response = await fetch(`${API_BASE}/onboarding/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to fetch onboarding profile');
  }

  const data = await response.json();
  return {
    company: data?.company ?? null,
    role: data?.role ?? null
  };
};

export const submitOnboardingData = async (formData: any, authToken: string) => {
  try {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    // 1. Submit main onboarding data (user_id from JWT)
    const onboardingResponse = await fetch(`${API_BASE}/onboarding`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        company: formData.company || null,
        profession: formData.profession || null,
        experience: formData.experience || null,
        industry: formData.industry || null,
        dataExperience: formData.dataExperience || null,
        primaryGoal: formData.primaryGoal || null,
        additionalInfo: formData.additionalInfo || null
      })
    });

    if (!onboardingResponse.ok) {
      console.error('Onboarding failed:', await onboardingResponse.text());
    }

    // 2. Submit tools if any
    if (formData.toolsUsed?.length > 0) {
      const toolsResponse = await fetch(`${API_BASE}/tools`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tools: formData.toolsUsed
        })
      });

      if (!toolsResponse.ok) {
        console.error('Tools failed:', await toolsResponse.text());
      }
    }

    // 3. Submit project types if any
    if (formData.projectTypes?.length > 0) {
      const projectResponse = await fetch(`${API_BASE}/project-types`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          projectTypes: formData.projectTypes
        })
      });

      if (!projectResponse.ok) {
        console.error('Project types failed:', await projectResponse.text());
      }
    }

    // 4. Submit preferences
    if (formData.dataTypes?.length > 0 || formData.preferredFeatures?.length > 0) {
      const prefResponse = await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          dataTypes: formData.dataTypes || [],
          preferredFeatures: formData.preferredFeatures || []
        })
      });

      if (!prefResponse.ok) {
        console.error('Preferences failed:', await prefResponse.text());
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw error;
  }
};