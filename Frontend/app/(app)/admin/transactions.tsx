import {
View,
Text,
FlatList,
RefreshControl,
ActivityIndicator
} from "react-native";
import { useEffect, useState } from "react";
import {  SafeAreaView } from "react-native-safe-area-context";
import { adminApi, AdminTransaction } from "@/lib/api/admin.api";
import TransactionCard  from "@/components/admin/TransactionCard";

export default function AdminTransactions(){


  const [ transactions, setTransactions ]=useState<AdminTransaction[]>([]);
  const [ loading, setLoading ]=useState(true);
  const [ refreshing, setRefreshing ]=useState(false);
  const [ page, setPage ]=useState(1);
  const [ pages, setPages ]=useState(1);
  const [ error, setError ]=useState("");
  const loadTransactions = async(
    pageNumber=1,
    refresh=false
  )=>{
    try{
      if(refresh){
        setRefreshing(true);
      } else{
        setLoading(true);
      }
      const response = await adminApi.getTransactions( pageNumber, 20 );
      setTransactions(
        previous=>
          pageNumber===1
          ?
          response.transactions
          :
          [
          ...previous,
          ...response.transactions
          ]
      );
      setPage(pageNumber);
      setPages(response.pages);
    } catch(error){
      console.log(
        "Transaction loading error",
        error
      );
      setError(
        "Unable to load transactions"
      );
    } finally{
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(()=>{
    loadTransactions();
  },[]);

  const refresh=()=>{
    loadTransactions(
      1,
      true
    );
  };

  const loadMore=()=>{
    if(page < pages){
      loadTransactions(
      page+1
      );
    }
  };

  if(loading){
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-500">
          Loading transactions...
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
      <View className="px-6 py-5">
        <Text className="text-primary dark:text-white text-3xl font-black">
          Transactions
        </Text>
        <Text className="text-gray-500 mt-1">
          Monitor wallet transfers
        </Text>
      </View>

      {
        error ?
        <Text className="text-red-500 text-center">
          {error}

        </Text>
        :
        <FlatList
          data={transactions}
            keyExtractor={
            item=>item.id
          }
          renderItem={({item})=>(

            <TransactionCard
            provider={
              item.recipientProvider
            }
            recipient={
              item.recipientNumber
            }
            amount={
              item.amount
            }
            fee={
              item.fee
            }
            status={
              item.status
            }
            sender={
              item.senderWallet.user.name
            }
            createdAt={
              item.createdAt
            }
            />
          )}
          ItemSeparatorComponent={()=>(
            <View className="h-4"/>
          )}
          contentContainerStyle={{
            paddingHorizontal:24,
            paddingBottom:40
          }}
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