import { atom } from 'jotai';

// Atom to track whether the user has any unread notifications
export const userHasUnreadNotificationsAtom = atom<boolean>(false); 