import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  Text,
  Progress,
  Select,
  HStack,
} from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CarbonImpactData {
  totalOffset: number;
  bySource: {
    SOLAR: number;
    WIND: number;
    HYDRO: number;
  };
  equivalencies: {
    treeYears: number;
    carMiles: number;
    homeEnergy: number;
  };
}

const CarbonImpact: React.FC = () => {
  const [impactData, setImpactData] = useState<CarbonImpactData | null>(null);
  const [timeframe, setTimeframe] = useState('month');

  const fetchCarbonImpact = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const response = await fetch(
        `http://localhost:3001/api/carbon/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setImpactData(data);
      }
    } catch (error) {
      console.error('Error fetching carbon impact:', error);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchCarbonImpact();
  }, [fetchCarbonImpact]);

  if (!impactData) return null;

  const sourceData = [
    { name: 'Solar', value: impactData.bySource.SOLAR },
    { name: 'Wind', value: impactData.bySource.WIND },
    { name: 'Hydro', value: impactData.bySource.HYDRO },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading>Carbon Impact</Heading>
        <Select
          width="200px"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </Select>
      </HStack>

      <Grid templateColumns="repeat(2, 1fr)" gap={8}>
        {/* Total Impact Stats */}
        <Box bg="white" p={6} rounded="lg" shadow="sm">
          <Stat>
            <StatLabel>Total Carbon Offset</StatLabel>
            <StatNumber>{impactData.totalOffset.toFixed(2)} tons CO₂</StatNumber>
            <StatHelpText>
              Equivalent to planting {Math.round(impactData.equivalencies.treeYears)} trees
            </StatHelpText>
          </Stat>

          <VStack spacing={4} mt={6}>
            <Box width="100%">
              <Text mb={2}>Impact by Source</Text>
              <Progress
                value={(impactData.bySource.SOLAR / impactData.totalOffset) * 100}
                colorScheme="yellow"
                size="lg"
                mb={2}
              />
              <Progress
                value={(impactData.bySource.WIND / impactData.totalOffset) * 100}
                colorScheme="blue"
                size="lg"
                mb={2}
              />
              <Progress
                value={(impactData.bySource.HYDRO / impactData.totalOffset) * 100}
                colorScheme="cyan"
                size="lg"
              />
            </Box>
          </VStack>
        </Box>

        {/* Impact Chart */}
        <Box bg="white" p={6} rounded="lg" shadow="sm" height="400px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                fill="#48BB78"
                name="Carbon Offset (tons CO₂)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Real-world Equivalencies */}
        <Box bg="white" p={6} rounded="lg" shadow="sm" gridColumn="span 2">
          <Heading size="md" mb={4}>
            Environmental Impact Equivalencies
          </Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            <Stat>
              <StatLabel>Trees Planted</StatLabel>
              <StatNumber>
                {Math.round(impactData.equivalencies.treeYears)}
              </StatNumber>
              <StatHelpText>Years of growth</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Car Miles Reduced</StatLabel>
              <StatNumber>
                {Math.round(impactData.equivalencies.carMiles).toLocaleString()}
              </StatNumber>
              <StatHelpText>Miles not driven</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Home Energy Saved</StatLabel>
              <StatNumber>
                {impactData.equivalencies.homeEnergy.toFixed(1)}
              </StatNumber>
              <StatHelpText>Homes powered for a month</StatHelpText>
            </Stat>
          </Grid>
        </Box>
      </Grid>
    </Box>
  );
};

export default CarbonImpact;
