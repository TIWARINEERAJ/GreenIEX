import React, { useState } from 'react';
import {
  Box,
  Grid,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { Order } from '../../types/market';

const TradingPortal: React.FC = () => {
  const toast = useToast();
  const [orderForm, setOrderForm] = useState({
    energyType: 'SOLAR',
    quantity: '',
    price: '',
    orderType: 'BUY',
    recAttached: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/market/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderForm),
      });

      if (response.ok) {
        toast({
          title: 'Order placed successfully',
          status: 'success',
          duration: 3000,
        });
        // Reset form
        setOrderForm({
          energyType: 'SOLAR',
          quantity: '',
          price: '',
          orderType: 'BUY',
          recAttached: false,
        });
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Error placing order',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Grid templateColumns="repeat(2, 1fr)" gap={8}>
        {/* Order Form */}
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Heading size="md" mb={6}>Place Order</Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Energy Type</FormLabel>
                <Select
                  value={orderForm.energyType}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    energyType: e.target.value,
                  })}
                >
                  <option value="SOLAR">Solar</option>
                  <option value="WIND">Wind</option>
                  <option value="HYDRO">Hydro</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Order Type</FormLabel>
                <Select
                  value={orderForm.orderType}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    orderType: e.target.value,
                  })}
                >
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantity (MWh)</FormLabel>
                <Input
                  type="number"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    quantity: e.target.value,
                  })}
                  min="0"
                  step="0.01"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Price (₹/kWh)</FormLabel>
                <Input
                  type="number"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    price: e.target.value,
                  })}
                  min="0"
                  step="0.01"
                />
              </FormControl>

              <Button type="submit" colorScheme="green" width="full">
                Place Order
              </Button>
            </VStack>
          </form>
        </Box>

        {/* Order Book */}
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Heading size="md" mb={6}>Order Book</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Price</Th>
                <Th>Quantity</Th>
                <Th>Energy</Th>
              </Tr>
            </Thead>
            <Tbody>
              {/* Order book data will be populated here */}
            </Tbody>
          </Table>
        </Box>
      </Grid>
    </Box>
  );
};

export default TradingPortal;
