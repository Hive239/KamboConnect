
import React, { useState, useEffect, useCallback } from 'react';
import { PractitionerBlockedDate } from "@/entities/PractitionerBlockedDate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, Plus, Trash2, Clock, 
  AlertCircle, Ban, Edit, Save, X 
} from "@/lib/icons";
import { format, startOfDay, isBefore } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BlockedDatesManager({ practitioner, onUpdate }) {
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBlock, setNewBlock] = useState({
    date: null,
    block_type: 'full_day',
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
    recurring: false
  });

  const loadBlockedDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const blocks = await PractitionerBlockedDate.filter({
        practitioner_id: practitioner.id
      }, '-date');
      setBlockedDates(blocks);
    } catch (error) {
      console.error("Failed to load blocked dates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [practitioner.id]);

  useEffect(() => {
    loadBlockedDates();
  }, [loadBlockedDates]);

  const handleAddBlock = async () => {
    if (!newBlock.date) return;

    try {
      const blockData = {
        practitioner_id: practitioner.id,
        date: format(newBlock.date, 'yyyy-MM-dd'),
        block_type: newBlock.block_type,
        reason: newBlock.reason,
        recurring: newBlock.recurring
      };

      if (newBlock.block_type === 'partial_day') {
        blockData.start_time = newBlock.start_time;
        blockData.end_time = newBlock.end_time;
      }

      await PractitionerBlockedDate.create(blockData);
      
      setNewBlock({
        date: null,
        block_type: 'full_day',
        start_time: '09:00',
        end_time: '17:00',
        reason: '',
        recurring: false
      });
      setIsAdding(false);
      loadBlockedDates();
      onUpdate();
    } catch (error) {
      console.error("Failed to create blocked date:", error);
    }
  };

  const handleUpdateBlock = async (blockId, updatedData) => {
    try {
      await PractitionerBlockedDate.update(blockId, updatedData);
      setEditingId(null);
      loadBlockedDates();
      onUpdate();
    } catch (error) {
      console.error("Failed to update blocked date:", error);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (confirm('Are you sure you want to remove this blocked date?')) {
      try {
        await PractitionerBlockedDate.delete(blockId);
        loadBlockedDates();
        onUpdate();
      } catch (error) {
        console.error("Failed to delete blocked date:", error);
      }
    }
  };

  const getBlockTypeColor = (blockType) => {
    const colors = {
      full_day: "bg-red-100 text-red-800 border-red-200",
      partial_day: "bg-orange-100 text-orange-800 border-orange-200", 
      exception: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return colors[blockType] || colors.full_day;
  };

  const BlockedDateItem = ({ block }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(block);

    const handleSave = () => {
      handleUpdateBlock(block.id, editData);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({...editData, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Block Type</Label>
                <Select value={editData.block_type} onValueChange={(value) => setEditData({...editData, block_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="partial_day">Partial Day</SelectItem>
                    <SelectItem value="exception">Exception</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editData.block_type === 'partial_day' && (
                <>
                  <div>
                    <Label>Start Time</Label>
                    <Input 
                      type="time"
                      value={editData.start_time}
                      onChange={(e) => setEditData({...editData, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input 
                      type="time"
                      value={editData.end_time}
                      onChange={(e) => setEditData({...editData, end_time: e.target.value})}
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <Label>Reason</Label>
                <Input 
                  value={editData.reason}
                  onChange={(e) => setEditData({...editData, reason: e.target.value})}
                  placeholder="Optional reason..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold">{format(new Date(block.date), 'EEEE, MMMM d, yyyy')}</h4>
                <Badge className={getBlockTypeColor(block.block_type)}>
                  {block.block_type === 'full_day' ? 'Full Day' : 
                   block.block_type === 'partial_day' ? 'Partial Day' : 'Exception'}
                </Badge>
                {block.recurring && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Recurring
                  </Badge>
                )}
              </div>
              
              {block.block_type === 'partial_day' && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <Clock className="w-4 h-4" />
                  {block.start_time} - {block.end_time}
                </div>
              )}
              
              {block.reason && (
                <p className="text-sm text-muted-foreground italic">{block.reason}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteBlock(block.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Blocked Dates & Exceptions
            </CardTitle>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" />
              Block Date
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New Block Form */}
          {isAdding && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-4">Block New Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={newBlock.date}
                      onSelect={(date) => setNewBlock({...newBlock, date})}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      className="rounded-lg border mt-2"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Block Type</Label>
                      <Select value={newBlock.block_type} onValueChange={(value) => setNewBlock({...newBlock, block_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_day">Full Day - Completely unavailable</SelectItem>
                          <SelectItem value="partial_day">Partial Day - Block specific hours</SelectItem>
                          <SelectItem value="exception">Exception - Override normal availability</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newBlock.block_type === 'partial_day' && (
                      <>
                        <div>
                          <Label>Start Time</Label>
                          <Input 
                            type="time"
                            value={newBlock.start_time}
                            onChange={(e) => setNewBlock({...newBlock, start_time: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input 
                            type="time"
                            value={newBlock.end_time}
                            onChange={(e) => setNewBlock({...newBlock, end_time: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Reason (Optional)</Label>
                      <Input 
                        value={newBlock.reason}
                        onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                        placeholder="Vacation, personal time, etc."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="recurring"
                        checked={newBlock.recurring}
                        onChange={(e) => setNewBlock({...newBlock, recurring: e.target.checked})}
                      />
                      <Label htmlFor="recurring">Recurring annually</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddBlock} disabled={!newBlock.date}>
                    <Save className="w-4 h-4 mr-2" />
                    Block Date
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Blocked Dates */}
          {blockedDates.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No blocked dates</h3>
              <p className="text-muted-foreground">Block specific dates when you're unavailable</p>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-4">Current Blocked Dates ({blockedDates.length})</h4>
              {blockedDates.map(block => (
                <BlockedDateItem key={block.id} block={block} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future: External Calendar Integration */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Coming Soon:</strong> Google Calendar integration to automatically sync your external calendar 
          and prevent double-bookings. This will import your existing events as blocked time slots.
        </AlertDescription>
      </Alert>
    </div>
  );
}
