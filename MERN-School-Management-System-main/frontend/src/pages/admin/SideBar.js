import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import HomeIcon from "@mui/icons-material/Home";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import ReportIcon from '@mui/icons-material/Report';

const SideBar = () => {
    const location = useLocation();
    return (
        <>
            <React.Fragment>
               { <ListItemButton component={Link} to="/Admin/dashboard">
                    <ListItemIcon>
                        <HomeIcon  color={location.pathname.startsWith('/Admin/dashboard') ? 'primary' : 'inherit'}/>
                    </ListItemIcon>
                    <ListItemText primary="Users Management" />
                </ListItemButton>}
                <ListItemButton component={Link} to="/Admin/calendar">
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith('/Admin/calendar') ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Répartition  Des Examens" /> 
                </ListItemButton>
                
                <ListItemButton component={Link} to="/Admin/showTeacher">
                    <ListItemIcon>
                        <SupervisorAccountOutlinedIcon color={location.pathname.startsWith("/showTeacher") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Teacher List" />
                </ListItemButton>
              
                <ListItemButton component={Link} to="/Admin/Plan">
                    <ListItemIcon>
                        <ReportIcon color={location.pathname.startsWith("/Admin/Plan") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Exam Planing" />
                </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
                <ListSubheader component="div" inset>
                    User
                </ListSubheader>
                <ListItemButton component={Link} to="/Admin/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Admin/profile") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                </ListItemButton>
                <ListItemButton component={Link} to="/logout">
                    <ListItemIcon>
                        <ExitToAppIcon color={location.pathname.startsWith("/logout") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </React.Fragment>
        </>
    )
}

export default SideBar
