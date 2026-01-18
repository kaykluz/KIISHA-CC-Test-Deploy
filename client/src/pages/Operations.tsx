import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationsDashboard } from "@/components/OperationsDashboard";
import { ConnectorManager } from "@/components/ConnectorManager";
import { AlertingSystem } from "@/components/AlertingSystem";
import { StakeholderPortalManager } from "@/components/StakeholderPortal";
import {
  LayoutDashboard,
  Plug,
  Bell,
  Users,
  FileText,
  Settings,
} from "lucide-react";

export default function Operations() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring, alerting, and stakeholder reporting
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="connectors" className="gap-2">
            <Plug className="w-4 h-4" />
            Connectors
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="portals" className="gap-2">
            <Users className="w-4 h-4" />
            Stakeholder Portals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <OperationsDashboard />
        </TabsContent>

        <TabsContent value="connectors">
          <ConnectorManager />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertingSystem />
        </TabsContent>

        <TabsContent value="portals">
          <StakeholderPortalManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
