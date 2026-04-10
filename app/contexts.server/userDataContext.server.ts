import { createContext } from 'react-router';
import type { User } from '~/types';

export const userDataContext = createContext<User>({
  id: '',
  name: '',
  familyName: '',
  givenName: '',
  username: '',
  email: '',
});
