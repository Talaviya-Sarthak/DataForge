# User Profile Dialog Installation

## Files Created/Modified

### New Files:
1. `src/components/ui/dialog.tsx` - Radix Dialog component
2. `src/components/ui/UserProfileDialog.tsx` - User profile dialog component

### Modified Files:
1. `src/components/layouts/Header.tsx` - Integrated profile dialog
2. `package.json` - Added @radix-ui/react-dialog dependency

## Installation Steps

1. **Install the new dependency:**
   ```bash
   npm install @radix-ui/react-dialog@^1.1.4
   ```

2. **The components are ready to use!** The Header component now opens the UserProfileDialog when the Account button is clicked.

## Customization

### Replace Mock Data
In `UserProfileDialog.tsx`, replace the `useUserProfile` hook with your actual TanStack Query hook:

```typescript
const useUserProfile = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
  })
  
  return { data, isLoading, error }
}
```

### Customize Actions
Update the `handleEditProfile` and `handleLogout` functions in `UserProfileDialog.tsx` with your actual logic.

## Features

✅ Modern, accessible dialog with focus trap
✅ Responsive design (max-w-md on desktop, full-width on mobile)
✅ Skeleton loading states
✅ Error handling
✅ Copy-to-clipboard for User ID
✅ Status badge with color coding
✅ Proper state reset on dialog close
✅ Keyboard navigation (ESC to close)
✅ ARIA labels for accessibility
✅ Smooth animations

## Styling

The dialog uses your existing Tailwind classes and follows the dark theme pattern used throughout the app. All styling is contained within the components and doesn't affect other parts of the application.