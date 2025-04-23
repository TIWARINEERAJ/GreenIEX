import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
} from '@chakra-ui/react';
import { MarketPrice } from '../../types/market';
import websocketService from '../../services/websocket';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketPrice[]>([]);
  const bgColor = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    websocketService.connect();
    websocketService.subscribeToMarketPrices((data) => {
      setMarketData(data);
    });

    return () => {
      websocketService.unsubscribe('marketPrices');
      websocketService.disconnect();
    };
  }, []);

  const getLatestPrice = (energyType: string) => {
    return marketData.find(data => data.energyType === energyType)?.price || 0;
  };

  return (
    <Box>
      <Heading mb={6}>Market Dashboard</Heading>
      
      <Grid templateColumns="repeat(3, 1fr)" gap={6} mb={8}>
        <Stat p={4} bg={bgColor} borderRadius="lg" shadow="sm">
          <StatLabel>Solar Energy</StatLabel>
          <StatNumber color="brand.solar">₹{getLatestPrice('SOLAR')}/kWh</StatNumber>
          <StatHelpText>Real-time market price</StatHelpText>
        </Stat>
        
        <Stat p={4} bg={bgColor} borderRadius="lg" shadow="sm">
          <StatLabel>Wind Energy</StatLabel>
          <StatNumber color="brand.wind">₹{getLatestPrice('WIND')}/kWh</StatNumber>
          <StatHelpText>Real-time market price</StatHelpText>
        </Stat>
        
        <Stat p={4} bg={bgColor} borderRadius="lg" shadow="sm">
          <StatLabel>Hydro Energy</StatLabel>
          <StatNumber color="brand.hydro">₹{getLatestPrice('HYDRO')}/kWh</StatNumber>
          <StatHelpText>Real-time market price</StatHelpText>
        </Stat>
      </Grid>

      <Box bg={bgColor} p={4} borderRadius="lg" shadow="sm" h="400px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={marketData}>
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#FFB800" name="Solar" />
            <Line type="monotone" dataKey="price" stroke="#00B4D8" name="Wind" />
            <Line type="monotone" dataKey="price" stroke="#0077BE" name="Hydro" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default Dashboard;
