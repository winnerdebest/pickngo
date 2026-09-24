import { apiClient } from './client';
import { Customer, CustomerCreate, Task } from './types';

/**
 * Customer API Endpoints
 */

export async function createCustomer(data: CustomerCreate): Promise<Customer> {
  const response = await apiClient.post<Customer>('/customers/', data);
  return response.data;
}

export async function getCustomer(customerId: string): Promise<Customer> {
  const response = await apiClient.get<Customer>(`/customers/${customerId}`);
  return response.data;
}

export async function getCustomers(skip = 0, limit = 50): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>('/customers/', {
    params: { skip, limit },
  });
  return response.data;
}

export async function getCustomerTasks(customerId: string): Promise<Task[]> {
  const response = await apiClient.get<Task[]>(`/customers/${customerId}/tasks`);
  return response.data;
}
