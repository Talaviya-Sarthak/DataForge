const API_BASE = 'http://localhost:5000/api/user';
const AUTH_BASE = 'http://localhost:5000/api/auth';

export const submitOnboardingData = async (formData: any) => {
  try {
    // Generate a unique email to avoid conflicts
    const timestamp = Date.now();
    const uniqueEmail = `${formData.name.replace(/\s+/g, '_')}_${timestamp}@dataforge.com`;
    
    // 1. First create user account
    const userResponse = await fetch(`${AUTH_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: uniqueEmail,
        password: 'temp123'
      })
    });

    if (!userResponse.ok) {
      throw new Error('Failed to create user account');
    }

    const userData = await userResponse.json();
    
    // 2. Sign in to get JWT token
    const signinResponse = await fetch(`${AUTH_BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'temp123'
      })
    });

    if (!signinResponse.ok) {
      throw new Error('Failed to sign in');
    }

    const signinData = await signinResponse.json();
    const token = signinData.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Submit main onboarding data (user_id from JWT)
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

    // 4. Submit tools if any
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

    // 5. Submit project types if any
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

    // 6. Submit preferences
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