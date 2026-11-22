import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { isQualifiedInvestor } from '@/lib/access';
export function useInvestorQualification(){
 const {user}=useAuth();
 const query=useQuery({queryKey:['investor-qualification',user?.id],enabled:Boolean(user),queryFn:()=>isQualifiedInvestor(user),staleTime:60000});
 return {qualified:Boolean(user)&&query.data===true,loading:query.isLoading,error:query.error};
}
