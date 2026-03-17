import { Router } from 'express';
import { DeleteUsers } from '../controllers/deleteUsers';

const deleteUsersRoutes = Router();

deleteUsersRoutes.post('/delete-users', DeleteUsers);

export default deleteUsersRoutes;
