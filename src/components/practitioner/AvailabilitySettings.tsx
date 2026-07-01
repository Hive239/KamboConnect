
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PractitionerAvailability } from "@/entities/PractitionerAvailability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Save, Plus, Trash2, Ban, AlertTriangle } from "@/lib/icons";

import BlockedDatesManager from "./BlockedDatesManager";
import ExceptionManager from "./ExceptionManager";

export default function AvailabilitySettings({ practitioner, onUpdate }) {
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = useMemo(() => [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ], []);

  const loadAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const practitionerAvailability = await PractitionerAvailability.filter({
        practitioner_id: practitioner.id
      });
      
      // Initialize with default availability if none exists
      if (practitionerAvailability.length === 0) {
        const defaultAvailability = daysOfWeek.map(day => ({
          practitioner_id: practitioner.id,
          day_of_week: day,
          start_time: "09:00",
          end_time: "17:00",
          is_available: false,
          notes: ""
        }));
        setAvailability(defaultAvailability);
      } else {
        setAvailability(practitionerAvailability);
      }
    } catch (error) {
      console.error("Failed to load availability:", error);
    } finally {
      setIsLoading(false);
    }
  }, [practitioner.id, daysOfWeek]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const updateAvailability = (dayIndex, field, value) => {
    setAvailability(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const addTimeSlot = (day) => {
    const newSlotData = {
      practitioner_id: practitioner.id,
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
      notes: ""
    };
    setAvailability(prev => [...prev, newSlotData]);
  };

  const removeTimeSlot = (dayIndex) => {
    setAvailability(prev => prev.filter((_, index) => index !== dayIndex));
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    try {
      // Delete existing availability
      const existingAvailability = await PractitionerAvailability.filter({
        practitioner_id: practitioner.id
      });
      
      for (const existing of existingAvailability) {
        await PractitionerAvailability.delete(existing.id);
      }

      // Create new availability entries
      for (const timeSlot of availability) {
        if (timeSlot.is_available) {
          await PractitionerAvailability.create({
            practitioner_id: practitioner.id,
            day_of_week: timeSlot.day_of_week,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
            is_available: timeSlot.is_available,
            notes: timeSlot.notes || ""
          });
        }
      }

      onUpdate();
    } catch (error) {
      console.error("Failed to save availability:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedByDay = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl">
          <TabsTrigger value="weekly" className="rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Weekly Hours
          </TabsTrigger>
          <TabsTrigger value="blocked" className="rounded-lg">
            <Ban className="w-4 h-4 mr-2" />
            Blocked Dates
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="rounded-lg">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Exceptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day, dayIndex) => {
                const daySlots = groupedByDay[day] || [
                  {
                    day_of_week: day,
                    start_time: "09:00",
                    end_time: "17:00",
                    is_available: false,
                    notes: ""
                  }
                ];

                return (
                  <div key={day} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground capitalize">
                        {day}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Slot
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {daySlots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={slot.is_available}
                                onChange={(e) => updateAvailability(
                                  availability.findIndex(a => a === slot),
                                  'is_available',
                                  e.target.checked
                                )}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium">Available</span>
                            </div>
                          </div>
                          
                          <div className="col-span-3">
                            <Label className="text-xs">Start Time</Label>
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateAvailability(
                                availability.findIndex(a => a === slot),
                                'start_time',
                                e.target.value
                              )}
                              disabled={!slot.is_available}
                            />
                          </div>

                          <div className="col-span-3">
                            <Label className="text-xs">End Time</Label>
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateAvailability(
                                availability.findIndex(a => a === slot),
                                'end_time',
                                e.target.value
                              )}
                              disabled={!slot.is_available}
                            />
                          </div>

                          <div className="col-span-3">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={slot.notes || ""}
                              onChange={(e) => updateAvailability(
                                availability.findIndex(a => a === slot),
                                'notes',
                                e.target.value
                              )}
                              placeholder="Optional notes"
                              disabled={!slot.is_available}
                            />
                          </div>

                          <div className="col-span-1">
                            {daySlots.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTimeSlot(availability.findIndex(a => a === slot))}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={saveAvailability}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Availability"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {availability.filter(a => a.is_available).length}
                </div>
                <div className="text-sm text-muted-foreground">Available Slots</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {new Set(availability.filter(a => a.is_available).map(a => a.day_of_week)).size}
                </div>
                <div className="text-sm text-muted-foreground">Available Days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {availability.filter(a => a.is_available).reduce((total, slot) => {
                    const start = new Date(`2000-01-01T${slot.start_time}`);
                    const end = new Date(`2000-01-01T${slot.end_time}`);
                    return total + ((end - start) / (1000 * 60 * 60));
                  }, 0).toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">Weekly Hours</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="py-6">
          <BlockedDatesManager practitioner={practitioner} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="exceptions" className="py-6">
          <ExceptionManager practitioner={practitioner} onUpdate={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
