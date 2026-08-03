import {
View,
Text,
FlatList,
RefreshControl,
ActivityIndicator
} from "react-native";
import {
useCallback,
useEffect,
useState
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
adminApi,
AdminUser
} from "@/lib/api/admin.api";
import UserCard from "@/components/admin/UserCard";


export default function AdminUsers(){

  const [users,setUsers]=useState<AdminUser[]>([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [error,setError]=useState("");

  const loadUsers = async(
    pageNumber=1,
    refresh=false
  )=>{
    try{
      if(refresh){
        setRefreshing(true);
      } else{
        setLoading(true);
      }
      const response = await adminApi.getUsers(
        pageNumber,
        20
      );
      setUsers(
        prev=>
          pageNumber===1
          ?
          response.users
          :
          [
          ...prev,
          ...response.users
          ]
      );
      setPage(pageNumber);
      setTotalPages(response.pages);
    } catch(e){
      console.log(e);
      setError(
        "Unable to load users"
      );
    } finally{
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(()=>{
    loadUsers();
  },[]);
  const refresh=()=>{
    loadUsers(1,true);
  };
  const loadMore=()=>{
    if(page < totalPages){
      loadUsers(page+1);
    }
  };

  if(loading){
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator
          size="large"
        />
        <Text className="mt-3 text-gray-500">
          Loading users...
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">

      <View className="px-6 py-5">
        <Text className="text-3xl font-black text-primary dark:text-white">
          Users
        </Text>

        <Text className="text-gray-500 mt-1">
          Manage registered PanWallet accounts
        </Text>
      </View>

      {
        error ?
        <Text className="text-center text-red-500">
          {error}
        </Text>
        :
        <FlatList
        data={users}
        keyExtractor={
          item=>item.id
        }
        renderItem={({item})=>(
          <UserCard
          name={item.name}
          phone={item.phoneNumber}
          email={item.email}
          status={item.status}
          wallets={
            item._count.wallets
          }
          createdAt={
            item.createdAt
          }
          />
        )}
        contentContainerStyle={{
          paddingHorizontal:24,
          paddingBottom:40
        }}
        ItemSeparatorComponent={()=>(
          <View className="h-4"/>
        )}
        refreshControl={
          <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        />
      }
    </SafeAreaView>
  )
}