import React, { useState, useEffect } from "react";
import { User, Report } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  Ban, 
  Mail, 
  Eye,
  AlertTriangle
} from "@/lib/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const UserActionModal = ({ user, action, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7");

  const actionTitles = {
    suspend: "Suspend User",
    ban: "Ban User",
    warn: "Send Warning"
  };

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionTitles[action]} - {user?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason (required)</label>
            <Textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this action..."
              className="mt-1"
            />
          </div>
          {action === 'suspend' && (
            <div>
              <label className="text-sm font-medium">Duration (days)</label>
              <Input 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => onConfirm(reason, duration)}
              disabled={!reason.trim()}
            >
              Confirm {actionTitles[action]}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const allUsers = await User.list('-created_date');
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleUserAction = async (reason, duration) => {
    if (!selectedUser || !selectedAction) return;

    try {
      // Create a report/log of this admin action
      await Report.create({
        reported_item_type: 'user',
        reported_item_id: selectedUser.id,
        reporter_id: 'admin', // Current admin user
        reason: `Admin ${selectedAction}: ${reason}`,
        status: 'resolved',
        admin_notes: `Duration: ${duration} days`,
        resolution_action: selectedAction
      });

      // Update user status (in a real app, this would update user fields like 'is_suspended', 'suspension_until', etc.)
      await User.update(selectedUser.id, {
        admin_notes: `${selectedAction.toUpperCase()}: ${reason}`,
        // In a real implementation, you'd add fields like:
        // is_suspended: selectedAction === 'suspend',
        // suspension_until: selectedAction === 'suspend' ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
        // is_banned: selectedAction === 'ban'
      });

      // Refresh user list
      loadUsers();
      setSelectedUser(null);
      setSelectedAction(null);
    } catch (error) {
      console.error("Failed to perform user action:", error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-primary">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { /* View profile */ }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setSelectedAction('warn'); }}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Send Warning
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setSelectedAction('suspend'); }}>
                          <Shield className="w-4 h-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setSelectedAction('ban'); }}>
                          <Ban className="w-4 h-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${user.email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserActionModal
        user={selectedUser}
        action={selectedAction}
        onClose={() => { setSelectedUser(null); setSelectedAction(null); }}
        onConfirm={handleUserAction}
      />
    </div>
  );
}