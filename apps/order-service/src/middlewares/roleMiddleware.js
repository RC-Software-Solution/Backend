// role base action permission management
// example - super_admin only can approve customer requests. But in future I can easily give the same power to admin by this

exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)){
            return res.status(403).json({ error: "You don't have permission to perform this action" });
        }
        next();
    };
};