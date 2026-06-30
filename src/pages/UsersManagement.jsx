import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Users, Upload } from "lucide-react";
import ImportUsersDialog from "@/components/users/ImportUsersDialog";
import ImportTenantsDialog from "@/components/users/ImportTenantsDialog";
import CustomersAndRoomsTab from "@/components/users/CustomersAndRoomsTab";
import RoomManagementTab from "@/components/users/RoomManagementTab";
import { canManageCustomers } from "@/lib/permissions";
import { useQueryClient } from "@tanstack/react-query";

export default function UsersManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTenantsDialog, setShowTenantsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("customers");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u || !canManageCustomers(u)) navigate("/");
    }).catch(() => navigate("/"));
  }, []);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          ניהול לקוחות
        </h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowTenantsDialog(true)}>
              <Upload className="w-4 h-4" />
              ייבוא דיירים
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowImportDialog(true)}>
              <Upload className="w-4 h-4" />
              ייבוא משתמשים
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="customers">לקוחות וחדרים</TabsTrigger>
          <TabsTrigger value="rooms">ניהול חדרים</TabsTrigger>
        </TabsList>
        <TabsContent value="customers">
          <CustomersAndRoomsTab />
        </TabsContent>
        <TabsContent value="rooms">
          <RoomManagementTab currentUser={currentUser} />
        </TabsContent>
      </Tabs>

      {showImportDialog && (
        <ImportUsersDialog
          onClose={() => setShowImportDialog(false)}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ["users-management"] });
            queryClient.invalidateQueries({ queryKey: ["imported-users"] });
          }}
        />
      )}

      {showTenantsDialog && (
        <ImportTenantsDialog
          onClose={() => setShowTenantsDialog(false)}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ["room-tenants"] });
          }}
        />
      )}
    </div>
  );
}