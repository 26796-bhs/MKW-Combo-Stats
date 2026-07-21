class Solution:
    def climbStairs(self, n: int) -> int:
        def step_back(current):
            print(current)
            if current<=1:
                return 1
            return step_back(current-1)+step_back(current-2)
        return step_back(n)