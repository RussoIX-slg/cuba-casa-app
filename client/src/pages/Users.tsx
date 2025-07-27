import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users as UsersIcon, UserPlus, Loader2 } from "lucide-react";
import { User } from "@shared/schema";

const createUserSchema = z.object({
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      reset();
      setIsCreating(false);
      toast({
        title: "User created successfully!",
        description: "The new user has been added to the database.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-slate-600">Loading users...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <UsersIcon className="mx-auto h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Users</h2>
              <p className="text-slate-600">Failed to load users from the database.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              User Management
            </h1>
            <p className="text-xl text-slate-600">
              Manage users stored in the PostgreSQL database
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New User
                </CardTitle>
                <CardDescription>
                  Add a new user to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...register("username")}
                      className={errors.username ? "border-red-500" : ""}
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  All Users ({users?.length || 0})
                </CardTitle>
                <CardDescription>
                  Users stored in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users && users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{user.username}</div>
                          <div className="text-sm text-slate-600">ID: {user.id}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Password: {user.password.substring(0, 8)}...
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <UsersIcon className="mx-auto h-12 w-12 mb-4" />
                    <p>No users found in the database.</p>
                    <p className="text-sm mt-2">Create your first user using the form.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}