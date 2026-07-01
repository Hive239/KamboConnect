
import React, { useState, useEffect, useCallback } from 'react';
import { PractitionerException } from "@/entities/PractitionerException";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon, Plus, Trash2, Clock,
  AlertTriangle, Save, X
} from "@/lib/icons";
import { format, startOfDay } from "date-fns";

export default function ExceptionManager({ practitioner, onUpdate }) {
  const [exceptions, setExceptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newException, setNewException] = useState({
    date: null,
    exception_type: 'override',
    start_time: '09:00',
    end_time: '17:00',
    notes: ''
  });

  const loadExceptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const exceptionList = await PractitionerException.filter({
        practitioner_id: practitioner.id
      }, '-date');
      setExceptions(exceptionList);
    } catch (error) {
      console.error("Failed to load exceptions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [practitioner.id]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const handleAddException = async () => {
    if (!newException.date) return;

    try {
      const dayOfWeek = format(newException.date, 'EEEE').toLowerCase();

      const exceptionData = {
        practitioner_id: practitioner.id,
        date: format(newException.date, 'yyyy-MM-dd'),
        day_of_week: dayOfWeek,
        exception_type: newException.exception_type,
        start_time: newException.start_time,
        end_time: newException.end_time,
        notes: newException.notes
      };

      await PractitionerException.create(exceptionData);

      setNewException({
        date: null,
        exception_type: 'override',
        start_time: '09:00',
        end_time: '17:00',
        notes: ''
      });
      setIsAdding(false);
      loadExceptions();
      onUpdate();
    } catch (error) {
      console.error("Failed to create exception:", error);
    }
  };

  const handleDeleteException = async (exceptionId) => {
    if (confirm('Are you sure you want to remove this exception?')) {
      try {
        await PractitionerException.delete(exceptionId);
        loadExceptions();
        onUpdate();
      } catch (error) {
        console.error("Failed to delete exception:", error);
      }
    }
  };

  const getExceptionTypeColor = (exceptionType) => {
    const colors = {
      override: "bg-blue-100 text-blue-800 border-blue-200",
      additional: "bg-primary/10 text-primary border-primary/20",
      remove: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[exceptionType] || colors.override;
  };

  const getExceptionTypeLabel = (exceptionType) => {
    const labels = {
      override: "Override Normal Hours",
      additional: "Additional Availability",
      remove: "Remove Availability"
    };
    return labels[exceptionType] || exceptionType;
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
              <AlertTriangle className="w-5 h-5" />
              Schedule Exceptions
            </CardTitle>
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" />
              Add Exception
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New Exception Form */}
          {isAdding && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-4">Create Schedule Exception</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={newException.date}
                      onSelect={(date) => setNewException({...newException, date})}
                      disabled={(date) => date < startOfDay(new Date())}
                      className="rounded-lg border mt-2"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Exception Type</Label>
                      <Select value={newException.exception_type} onValueChange={(value) => setNewException({...newException, exception_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="override">Override - Change normal hours for this date</SelectItem>
                          <SelectItem value="additional">Additional - Add extra availability beyond normal hours</SelectItem>
                          <SelectItem value="remove">Remove - Cancel normal availability for this date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newException.exception_type !== 'remove' && (
                      <>
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={newException.start_time}
                            onChange={(e) => setNewException({...newException, start_time: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={newException.end_time}
                            onChange={(e) => setNewException({...newException, end_time: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newException.notes}
                        onChange={(e) => setNewException({...newException, notes: e.target.value})}
                        placeholder="Special instructions or notes about this exception..."
                        className="h-20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddException} disabled={!newException.date}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Exception
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Exceptions */}
          {exceptions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No schedule exceptions</h3>
              <p className="text-muted-foreground">Create exceptions to override your normal weekly availability</p>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-4">Current Exceptions ({exceptions.length})</h4>
              <div className="space-y-4">
                {exceptions.map(exception => (
                  <Card key={exception.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{format(new Date(exception.date), 'EEEE, MMMM d, yyyy')}</h4>
                            <Badge className={getExceptionTypeColor(exception.exception_type)}>
                              {getExceptionTypeLabel(exception.exception_type)}
                            </Badge>
                          </div>

                          {exception.exception_type !== 'remove' && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <Clock className="w-4 h-4" />
                              {exception.start_time} - {exception.end_time}
                            </div>
                          )}

                          {exception.notes && (
                            <p className="text-sm text-muted-foreground italic">{exception.notes}</p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteException(exception.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
