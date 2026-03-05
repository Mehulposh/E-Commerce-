import { getUserById, getUsers, updateUser , deleteUser } from "../service/serviceClient";

const token = (req) => req.headers.authorization.split(' ')[1]


// GET /api/admin/users
const getAllUsers = async(req,res,next) => {
    try {
        const {page = 1, limit= 10 , role, search} = req.body

        let query = `?page=&{page}&limit=$[limit]`
        if(role) query += `&role=${role}`
        if(search) query += `&search=${search}`

        const response = await getUsers(token(req), query)

        res.json(response.data)
    } catch (error) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(error)
    }
}


// GET /api/admin/users/:id
const getUserDetails = async (req,res,next) => {
    try {
        const id = req.params.id
        const response = await getUserById(token(req), id)

        res.json(response.data)
    } catch (error) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(error)
    }
}

// PATCH /api/admin/users/:id
// Body: { role, isBanned, name }
const editUser = async (req,res,next) => {
    try {
        const id = req.params.id
        const {role, isBanned, name} = req.body

        const response = await updateUser(token(req),id,  { role, isBanned, name } )

        res.json(response.data)
    } catch (error) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        next(error)
    }
}


// PATCH /api/admin/users/:id/ban
const banUser = async (req, res, next) => {
  try {
    const id = req.params.id

    const response = await updateUser(token(req), id, { isBanned: true });

    res.json({ message: 'User banned', ...response.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};


// PATCH /api/admin/users/:id/unban
const unbanUser = async (req, res, next) => {
  try {
    const id = req.params.id

    const response = await updateUser(token(req),id, { isBanned: false });

    res.json({ message: 'User unbanned', ...response.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};


// DELETE /api/admin/users/:id
const removeUser = async (req, res, next) => {
  try {
    const id = req.params.id 

    // Prevent admin from deleting themselves
    if (id === req.user._id?.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const response = await deleteUser(token(req), id);

    res.json(response.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};


export {
    removeUser,
    editUser,
    getAllUsers,
    banUser,
    unbanUser,
    getUserDetails
}