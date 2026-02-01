const API_BASE = 'http://localhost:5000/api/users';

export const submitOnboardingData = async (formData: any) => {
  try {
    // Generate a unique email to avoid conflicts
    const timestamp = Date.now();
    const uniqueEmail = `${formData.username}_${timestamp}@dataforge.com`;
    
    // 1. First create user account
    const userResponse = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name || formData.username,
        email: uniqueEmail,
        password: 'temp123'
      })
    });

    if (!userResponse.ok) {
      throw new Error('Failed to create user account');
    }

    const userData = await userResponse.json();
    const userId = userData.user_id || userData.id;

    // 2. Submit main onboarding data
    await fetch(`${API_BASE}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        company: formData.company,
        profession: formData.profession,
        experience: formData.experience,
        industry: formData.industry,
        data_experience: formData.dataExperience,
        primary_goal: formData.primaryGoal,
        additional_info: formData.additionalInfo
      })
    });

    // 3. Submit tools if any
    if (formData.toolsUsed?.length > 0) {
      await fetch(`${API_BASE}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tools: formData.toolsUsed
        })
      });
    }

    // 4. Submit project types if any
    if (formData.projectTypes?.length > 0) {
      await fetch(`${API_BASE}/project-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_types: formData.projectTypes
        })
      });
    }

    // 5. Submit preferences
    const preferences = [];
    
    if (formData.dataTypes?.length > 0) {
      formData.dataTypes.forEach((dataType: string) => {
        preferences.push({
          preference_type: 'DATA_TYPE',
          preference_value: dataType
        });
      });
    }

    if (formData.preferredFeatures?.length > 0) {
      formData.preferredFeatures.forEach((feature: string) => {
        preferences.push({
          preference_type: 'FEATURE',
          preference_value: feature
        });
      });
    }

    if (preferences.length > 0) {
      await fetch(`${API_BASE}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          preferences
        })
      });
    }

    return { success: true, userId };
  } catch (error) {
    console.error('Onboarding submission error:', error);
    throw error;
  }
};