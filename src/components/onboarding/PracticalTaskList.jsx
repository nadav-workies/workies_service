import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, AlertCircle, Circle } from "lucide-react";
import { TASK_STATUS_CONFIG } from "@/lib/onboardingTemplate";

export default function PracticalTaskList({ tasks, onUpdate, isManager }) {
  const [editingId, setEditingId] = useState(null);
  const [comment, setComment] = useState("");

  if (!tasks || tasks.length === 0) {
    return <Card className="p-6 text-center text-sm text-muted-foreground">אין משימות מעשיות בשלב זה</Card>;
  }

  const statusIcons = {
    pending: <Circle className="w-3.5 h-3.5 text-gray-400" />,
    in_progress: <Clock className="w-3.5 h-3.5 text-blue-500" />,
    done: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    revision_required: <AlertCircle className="w-3.5 h-3.5 text-orange-500" />,
  };

  return (
    <div className="space-y-2 min-w-0" dir="rtl">
      {tasks.map((task) => {
        const config = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
        return (
          <Card key={task.id} className="p-3 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              {statusIcons[task.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.instructions}</p>

                {task.employee_comment && (
                  <p className="text-xs bg-muted/40 rounded p-1.5 mt-1.5">
                    <span className="font-semibold">עובדת: </span>{task.employee_comment}
                  </p>
                )}
                {task.mentor_comment && (
                  <p className="text-xs bg-blue-50 rounded p-1.5 mt-1">
                    <span className="font-semibold">חונך: </span>{task.mentor_comment}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {task.due_date && (
                    <span className="text-[10px] text-muted-foreground">יעד: {task.due_date}</span>
                  )}
                  {task.approved_by && (
                    <span className="text-[10px] text-green-600">אושר ע״י {task.approved_by}</span>
                  )}
                </div>

                {/* Quick status buttons */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {task.status !== "in_progress" && task.status !== "done" && (
                    <Button size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => onUpdate(task, { status: "in_progress" })}>
                      התחל
                    </Button>
                  )}
                  {task.status !== "done" && (
                    <Button size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => onUpdate(task, { status: "done", employee_comment: comment })}>
                      סמן כבוצע
                    </Button>
                  )}
                  {editingId === task.id ? (
                    <>
                      <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                        placeholder="הערה..." className="text-xs min-h-[40px] mt-1" />
                      <Button size="sm" className="h-6 text-xs"
                        onClick={() => { onUpdate(task, { employee_comment: comment }); setEditingId(null); setComment(""); }}>
                        שמור הערה
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-6 text-xs"
                      onClick={() => { setEditingId(task.id); setComment(task.employee_comment || ""); }}>
                      הוסף הערה
                    </Button>
                  )}
                  {isManager && task.status === "done" && !task.approved_by && (
                    <Button size="sm" variant="outline" className="h-6 text-xs text-green-600"
                      onClick={() => onUpdate(task, { mentor_comment: comment || "אושר", approved_by: "מנהל" })}>
                      אשר
                    </Button>
                  )}
                  {isManager && task.status !== "revision_required" && (
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-orange-600"
                      onClick={() => onUpdate(task, { status: "revision_required" })}>
                      נדרש תיקון
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}